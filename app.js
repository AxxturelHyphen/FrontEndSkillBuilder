// ============================================================
// app.js — Lógica principal del dashboard de solicitudes
// ============================================================

// Estado global de la aplicación
const estado = {
  solicitudes: [],        // Todas las solicitudes cargadas
  filtroActual: null,     // null = todas, o 'pendiente'/'confirmada'/'denegada'
  conectado: false,       // Estado de conexión a MongoDB
  pollingId: null,        // ID del intervalo de polling
  cargando: true          // Indicador de carga inicial
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar conexión a MongoDB
  const conectado = await verificarConexion()
  estado.conectado = conectado
  MOCK_MODE = !conectado

  actualizarIndicadorConexion()

  // Si estamos en modo mock, mostrar banner
  if (MOCK_MODE) {
    mostrarBannerMock()
  }

  // Cargar solicitudes iniciales
  await cargarSolicitudes()

  // Configurar filtros
  configurarFiltros()

  // Configurar modal de detalle
  configurarModal()

  // Iniciar polling automático
  iniciarPolling()

  estado.cargando = false
})

// ============================================================
// CARGA DE DATOS
// ============================================================

/**
 * Cargar solicitudes desde la base de datos y actualizar toda la UI
 */
async function cargarSolicitudes() {
  try {
    const solicitudes = await fetchSolicitudes()
    estado.solicitudes = solicitudes
    renderizarTodo()
  } catch (e) {
    console.error('[ERROR] cargarSolicitudes:', e.message)
    mostrarError('Error al cargar solicitudes')
  }
}

/**
 * Renderizar todos los componentes de la UI
 */
function renderizarTodo() {
  renderizarEstadisticas()
  renderizarTabla()
  renderizarGraficas()
}

// ============================================================
// ESTADÍSTICAS
// ============================================================

/**
 * Calcular y mostrar las estadísticas rápidas
 */
function renderizarEstadisticas() {
  const stats = calcularEstadisticas()

  document.getElementById('stat-total').textContent = stats.total
  document.getElementById('stat-pendiente').textContent = stats.pendiente
  document.getElementById('stat-confirmada').textContent = stats.confirmada
  document.getElementById('stat-denegada').textContent = stats.denegada
}

/**
 * Calcular conteos por estado
 * @returns {Object} { total, pendiente, confirmada, denegada }
 */
function calcularEstadisticas() {
  const solicitudes = estado.solicitudes
  return {
    total: solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    confirmada: solicitudes.filter(s => s.estado === 'confirmada').length,
    denegada: solicitudes.filter(s => s.estado === 'denegada').length
  }
}

// ============================================================
// TABLA DE SOLICITUDES
// ============================================================

/**
 * Renderizar la tabla con las solicitudes filtradas
 */
function renderizarTabla() {
  const tbody = document.getElementById('tabla-body')
  const solicitudesFiltradas = obtenerSolicitudesFiltradas()

  if (solicitudesFiltradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">
          NO HAY SOLICITUDES ${estado.filtroActual ? '[ ' + estado.filtroActual.toUpperCase() + ' ]' : ''}
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = solicitudesFiltradas.map((s, index) => {
    const esNueva = s._nueva ? ' style="background: var(--superficie);"' : ''
    const claseDenegada = s.estado === 'denegada' ? ' fila--denegada' : ''
    const idCorto = (s._id || '').substring(0, 8)
    const fecha = formatearFecha(s.fechaSolicitada)
    const hora = s.horaSolicitada || '--:--'

    return `
      <tr class="fila${claseDenegada}" data-id="${s._id}"${esNueva}>
        <td class="celda-id" title="${s._id}">${idCorto}</td>
        <td>
          <span class="nombre-cliente" role="button" tabindex="0"
                onclick="mostrarDetalle('${s._id}')"
                onkeydown="if(event.key==='Enter')mostrarDetalle('${s._id}')">
            ${escapeHtml(s.nombreCliente || 'Sin nombre')}
          </span>
        </td>
        <td>${fecha} ${hora}</td>
        <td>${escapeHtml(s.servicio || 'Sin servicio')}</td>
        <td>${generarBadge(s.estado)}</td>
        <td>
          <div class="acciones">
            ${s.estado === 'pendiente' ? `
              <button class="btn-accion" onclick="confirmarSolicitud('${s._id}')">CONFIRMAR</button>
              <button class="btn-accion" onclick="denegarSolicitud('${s._id}')">DENEGAR</button>
            ` : `
              <button class="btn-accion" disabled>---</button>
            `}
          </div>
        </td>
      </tr>
    `
  }).join('')
}

/**
 * Obtener solicitudes según el filtro activo
 * @returns {Array} Solicitudes filtradas
 */
function obtenerSolicitudesFiltradas() {
  if (!estado.filtroActual) return estado.solicitudes
  return estado.solicitudes.filter(s => s.estado === estado.filtroActual)
}

/**
 * Generar HTML del badge de estado
 * @param {string} estadoSolicitud - 'pendiente', 'confirmada', 'denegada'
 * @returns {string} HTML del badge
 */
function generarBadge(estadoSolicitud) {
  const clase = `badge--${estadoSolicitud}`
  const texto = estadoSolicitud.toUpperCase()
  return `<span class="badge ${clase}">${texto}</span>`
}

// ============================================================
// ACCIONES: CONFIRMAR / DENEGAR
// ============================================================

/**
 * Confirmar una solicitud (optimistic UI)
 * @param {string} id - ID de la solicitud
 */
async function confirmarSolicitud(id) {
  await cambiarEstado(id, 'confirmada')
}

/**
 * Denegar una solicitud (optimistic UI)
 * @param {string} id - ID de la solicitud
 */
async function denegarSolicitud(id) {
  await cambiarEstado(id, 'denegada')
}

/**
 * Cambiar el estado de una solicitud con optimistic UI
 * @param {string} id - ID de la solicitud
 * @param {string} nuevoEstado - Nuevo estado a establecer
 */
async function cambiarEstado(id, nuevoEstado) {
  // Guardar estado anterior para posible reversión
  const solicitud = estado.solicitudes.find(s => s._id === id)
  if (!solicitud) return

  const estadoAnterior = solicitud.estado

  // Optimistic UI: actualizar inmediatamente
  solicitud.estado = nuevoEstado
  solicitud.fechaActualizacion = new Date().toISOString()
  renderizarTodo()

  try {
    // Enviar actualización al servidor
    await actualizarEstado(id, nuevoEstado)
  } catch (e) {
    // Si falla, revertir el cambio
    solicitud.estado = estadoAnterior
    solicitud.fechaActualizacion = null
    renderizarTodo()
    mostrarError(`[ERROR] No se pudo actualizar la solicitud ${id.substring(0, 8)}`)
  }
}

// ============================================================
// FILTROS
// ============================================================

/**
 * Configurar los botones de filtro
 */
function configurarFiltros() {
  const contenedor = document.getElementById('filtros')
  const botones = contenedor.querySelectorAll('.filtros__btn')

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      const filtro = btn.dataset.filtro || null

      // Actualizar estado
      estado.filtroActual = filtro

      // Actualizar clases de botones
      botones.forEach(b => b.classList.remove('filtros__btn--activo'))
      btn.classList.add('filtros__btn--activo')

      // Re-renderizar tabla
      renderizarTabla()
    })
  })
}

// ============================================================
// GRÁFICAS
// ============================================================

/**
 * Renderizar las dos gráficas SVG
 */
function renderizarGraficas() {
  const stats = calcularEstadisticas()

  // Gráfica de barras — solicitudes por día
  const contenedorBarras = document.getElementById('grafica-barras')
  contenedorBarras.innerHTML = generarGraficaBarras(estado.solicitudes)

  // Gráfica de distribución de estados
  const contenedorEstados = document.getElementById('grafica-estados')
  contenedorEstados.innerHTML = generarGraficaEstados(stats)

  // Animar barras después de insertar en el DOM
  animarBarras()
}

/**
 * Animar las barras del gráfico (crecimiento desde 0)
 */
function animarBarras() {
  const barras = document.querySelectorAll('.chart-bar')
  barras.forEach(barra => {
    const targetY = parseFloat(barra.getAttribute('data-target-y'))
    const targetHeight = parseFloat(barra.getAttribute('data-target-height'))
    const delay = parseFloat(barra.style.animationDelay) || 0

    // Establecer posición inicial
    const baseY = parseFloat(barra.getAttribute('y'))

    setTimeout(() => {
      barra.setAttribute('y', targetY)
      barra.setAttribute('height', targetHeight)
      barra.style.transition = 'y 400ms ease, height 400ms ease'
    }, delay)
  })
}

// ============================================================
// MODAL DE DETALLE
// ============================================================

/**
 * Configurar el overlay del modal
 */
function configurarModal() {
  const overlay = document.getElementById('detalle-overlay')
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrarDetalle()
  })

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarDetalle()
  })
}

/**
 * Mostrar el panel de detalle de una solicitud
 * @param {string} id - ID de la solicitud
 */
function mostrarDetalle(id) {
  const solicitud = estado.solicitudes.find(s => s._id === id)
  if (!solicitud) return

  const panel = document.getElementById('detalle-contenido')
  panel.innerHTML = `
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">ID</div>
      <div class="detalle-panel__valor">${solicitud._id}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">CLIENTE</div>
      <div class="detalle-panel__valor">${escapeHtml(solicitud.nombreCliente || 'Sin nombre')}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">TELEFONO</div>
      <div class="detalle-panel__valor">${escapeHtml(solicitud.telefonoCliente || 'No disponible')}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">SERVICIO</div>
      <div class="detalle-panel__valor">${escapeHtml(solicitud.servicio || 'Sin servicio')}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">FECHA SOLICITADA</div>
      <div class="detalle-panel__valor">${formatearFecha(solicitud.fechaSolicitada)} ${solicitud.horaSolicitada || ''}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">ESTADO</div>
      <div class="detalle-panel__valor">${generarBadge(solicitud.estado)}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">MENSAJE ORIGINAL</div>
      <div class="detalle-panel__valor">${escapeHtml(solicitud.mensajeOriginal || 'Sin mensaje')}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">ID TELEGRAM</div>
      <div class="detalle-panel__valor">${escapeHtml(solicitud.idTelegram || 'No disponible')}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">FECHA CREACION</div>
      <div class="detalle-panel__valor">${formatearFechaCompleta(solicitud.fechaCreacion)}</div>
    </div>
    <div class="detalle-panel__campo">
      <div class="detalle-panel__label">ULTIMA ACTUALIZACION</div>
      <div class="detalle-panel__valor">${solicitud.fechaActualizacion ? formatearFechaCompleta(solicitud.fechaActualizacion) : 'Sin actualizar'}</div>
    </div>
  `

  document.getElementById('detalle-overlay').classList.add('detalle-overlay--visible')
}

/**
 * Cerrar el panel de detalle
 */
function cerrarDetalle() {
  document.getElementById('detalle-overlay').classList.remove('detalle-overlay--visible')
}

// ============================================================
// POLLING
// ============================================================

/**
 * Iniciar el polling automático cada 30 segundos
 */
function iniciarPolling() {
  estado.pollingId = setInterval(async () => {
    try {
      const nuevas = await fetchSolicitudes()

      // Detectar solicitudes nuevas (por _id)
      const idsActuales = new Set(estado.solicitudes.map(s => s._id))
      const solicitudesNuevas = nuevas.filter(s => !idsActuales.has(s._id))

      // Marcar las nuevas para animación
      solicitudesNuevas.forEach(s => { s._nueva = true })

      // Actualizar estado global (incluye cambios de estado remotos)
      estado.solicitudes = nuevas
      renderizarTodo()

      // Quitar marca de nueva después de la animación
      setTimeout(() => {
        solicitudesNuevas.forEach(s => { delete s._nueva })
      }, 1000)

      // Actualizar timestamp de última actualización
      actualizarTimestamp()
    } catch (e) {
      console.error('[ERROR] polling:', e.message)
    }
  }, POLLING_INTERVAL)
}

/**
 * Actualizar el timestamp del último refresh en el footer
 */
function actualizarTimestamp() {
  const el = document.getElementById('ultimo-refresh')
  if (el) {
    const ahora = new Date()
    el.textContent = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}:${ahora.getSeconds().toString().padStart(2, '0')}`
  }
}

// ============================================================
// INDICADOR DE CONEXIÓN
// ============================================================

/**
 * Actualizar el indicador visual de conexión en el header
 */
function actualizarIndicadorConexion() {
  const indicador = document.getElementById('indicador-conexion')
  const texto = document.getElementById('texto-conexion')

  if (estado.conectado) {
    indicador.classList.remove('header__indicador--desconectado')
    texto.textContent = 'CONECTADO'
  } else {
    indicador.classList.add('header__indicador--desconectado')
    texto.textContent = 'MODO LOCAL'
  }
}

// ============================================================
// BANNER MOCK
// ============================================================

/**
 * Mostrar banner indicando que se usan datos de ejemplo
 */
function mostrarBannerMock() {
  const banner = document.getElementById('mock-banner')
  if (banner) {
    banner.style.display = 'block'
  }
}

// ============================================================
// ERRORES
// ============================================================

/**
 * Mostrar un mensaje de error temporal
 * @param {string} mensaje - Texto del error
 */
function mostrarError(mensaje) {
  const contenedor = document.getElementById('error-container')
  if (!contenedor) return

  contenedor.textContent = mensaje
  contenedor.classList.add('error-msg--visible')

  // Ocultar después de 5 segundos
  setTimeout(() => {
    contenedor.classList.remove('error-msg--visible')
  }, 5000)
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Formatear fecha ISO a formato legible (DD/MM/YYYY)
 * @param {string} fechaStr - Fecha en formato ISO o YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatearFecha(fechaStr) {
  if (!fechaStr) return '--/--/----'
  const partes = fechaStr.split('T')[0].split('-')
  if (partes.length !== 3) return fechaStr
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

/**
 * Formatear fecha ISO completa con hora
 * @param {string} fechaStr - Fecha en formato ISO
 * @returns {string} Fecha y hora formateadas
 */
function formatearFechaCompleta(fechaStr) {
  if (!fechaStr) return '--'
  try {
    const fecha = new Date(fechaStr)
    const dia = fecha.getDate().toString().padStart(2, '0')
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const anio = fecha.getFullYear()
    const hora = fecha.getHours().toString().padStart(2, '0')
    const min = fecha.getMinutes().toString().padStart(2, '0')
    return `${dia}/${mes}/${anio} ${hora}:${min}`
  } catch (e) {
    return fechaStr
  }
}

/**
 * Escapar HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
