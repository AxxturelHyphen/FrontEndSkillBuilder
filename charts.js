// ============================================================
// charts.js — Gráficas SVG inline (sin librerías externas)
// ============================================================

/**
 * Generar gráfica de barras verticales — solicitudes por día (últimos 7 días)
 * @param {Array} solicitudes - Lista completa de solicitudes
 * @returns {string} SVG como string HTML
 */
function generarGraficaBarras(solicitudes) {
  const hoy = new Date()
  const dias = []
  const conteos = []

  // Calcular los últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - i)
    const fechaStr = fecha.toISOString().split('T')[0]
    dias.push(fecha)
    // Contar solicitudes creadas en ese día
    const conteo = solicitudes.filter(s => {
      const fechaCreacion = s.fechaCreacion.split('T')[0]
      return fechaCreacion === fechaStr
    }).length
    conteos.push(conteo)
  }

  const maxConteo = Math.max(...conteos, 1) // Evitar división por cero

  // Dimensiones del SVG
  const svgWidth = 560
  const svgHeight = 200
  const margenInferior = 40
  const margenSuperior = 20
  const margenIzquierdo = 30
  const areaAltura = svgHeight - margenInferior - margenSuperior
  const anchoBarra = 40
  const espacioBarra = 20
  const totalAnchoBarra = anchoBarra + espacioBarra

  // Nombres de días en español (abreviados)
  const nombresDias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']

  let barrasHtml = ''

  for (let i = 0; i < 7; i++) {
    const x = margenIzquierdo + i * totalAnchoBarra + espacioBarra / 2
    const alturaBarra = (conteos[i] / maxConteo) * areaAltura
    const y = margenSuperior + areaAltura - alturaBarra

    const estaActiva = conteos[i] > 0
    const fill = estaActiva ? '#000' : '#f0f0f0'
    const stroke = '#000'

    // Barra con animación
    barrasHtml += `
      <rect
        class="chart-bar"
        x="${x}" y="${margenSuperior + areaAltura}"
        width="${anchoBarra}" height="0"
        fill="${fill}" stroke="${stroke}" stroke-width="1"
        data-target-y="${y}"
        data-target-height="${alturaBarra}"
        style="animation: barGrow 400ms ${i * 80}ms ease forwards;"
      />
    `

    // Valor encima de la barra
    barrasHtml += `
      <text
        x="${x + anchoBarra / 2}" y="${y - 6}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="11" fill="#000"
        class="chart-label"
        style="opacity: 0; animation: fadeIn 200ms ${i * 80 + 300}ms ease forwards;"
      >${conteos[i]}</text>
    `

    // Etiqueta del día
    const diaSemana = nombresDias[dias[i].getDay()]
    barrasHtml += `
      <text
        x="${x + anchoBarra / 2}" y="${svgHeight - margenInferior + 16}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="10" fill="#000"
      >${diaSemana}</text>
    `

    // Fecha debajo del día
    const diaNumero = dias[i].getDate().toString().padStart(2, '0')
    const mesNumero = (dias[i].getMonth() + 1).toString().padStart(2, '0')
    barrasHtml += `
      <text
        x="${x + anchoBarra / 2}" y="${svgHeight - margenInferior + 28}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="9" fill="#000"
      >${diaNumero}/${mesNumero}</text>
    `
  }

  // Línea base
  barrasHtml += `
    <line
      x1="${margenIzquierdo}" y1="${margenSuperior + areaAltura}"
      x2="${margenIzquierdo + 7 * totalAnchoBarra}" y2="${margenSuperior + areaAltura}"
      stroke="#000" stroke-width="1"
    />
  `

  return `
    <svg width="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      ${barrasHtml}
    </svg>
  `
}

/**
 * Generar gráfica de distribución de estados
 * Tres rectángulos proporcionales en horizontal
 * @param {Object} stats - { pendiente, confirmada, denegada }
 * @returns {string} SVG como string HTML
 */
function generarGraficaEstados(stats) {
  const total = stats.pendiente + stats.confirmada + stats.denegada
  if (total === 0) {
    return `
      <svg width="100%" viewBox="0 0 560 80" xmlns="http://www.w3.org/2000/svg">
        <text x="280" y="45" text-anchor="middle"
          font-family="'JetBrains Mono', monospace" font-size="12" fill="#000">
          SIN DATOS
        </text>
      </svg>
    `
  }

  const svgWidth = 560
  const svgHeight = 80
  const barY = 10
  const barHeight = 36
  const margen = 2

  // Calcular anchos proporcionales
  const anchoDisponible = svgWidth - margen * 2 // margen entre barras
  const anchoPendiente = (stats.pendiente / total) * anchoDisponible
  const anchoConfirmada = (stats.confirmada / total) * anchoDisponible
  const anchoDenegada = (stats.denegada / total) * anchoDisponible

  let x = 0
  let html = ''

  // Barra PENDIENTE — fondo blanco, borde negro
  if (stats.pendiente > 0) {
    html += `
      <rect x="${x}" y="${barY}" width="${anchoPendiente}" height="${barHeight}"
        fill="#fff" stroke="#000" stroke-width="1"
        class="dist-bar" style="animation: distGrow 500ms ease forwards;" />
      <text x="${x + anchoPendiente / 2}" y="${barY + barHeight / 2 + 4}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#000">
        PEND. ${stats.pendiente}
      </text>
    `
    x += anchoPendiente + margen
  }

  // Barra CONFIRMADA — fondo negro, texto blanco
  if (stats.confirmada > 0) {
    html += `
      <rect x="${x}" y="${barY}" width="${anchoConfirmada}" height="${barHeight}"
        fill="#000" stroke="#000" stroke-width="1"
        class="dist-bar" style="animation: distGrow 500ms 100ms ease forwards;" />
      <text x="${x + anchoConfirmada / 2}" y="${barY + barHeight / 2 + 4}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#fff">
        CONF. ${stats.confirmada}
      </text>
    `
    x += anchoConfirmada + margen
  }

  // Barra DENEGADA — fondo #f0f0f0, texto tachado
  if (stats.denegada > 0) {
    html += `
      <rect x="${x}" y="${barY}" width="${anchoDenegada}" height="${barHeight}"
        fill="#f0f0f0" stroke="#000" stroke-width="1"
        class="dist-bar" style="animation: distGrow 500ms 200ms ease forwards;" />
      <text x="${x + anchoDenegada / 2}" y="${barY + barHeight / 2 + 4}"
        text-anchor="middle"
        font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#000"
        text-decoration="line-through">
        DEN. ${stats.denegada}
      </text>
    `
  }

  // Leyenda debajo
  html += `
    <rect x="0" y="${barY + barHeight + 14}" width="10" height="10" fill="#fff" stroke="#000" stroke-width="1" />
    <text x="14" y="${barY + barHeight + 23}"
      font-family="'JetBrains Mono', monospace" font-size="9" fill="#000">PENDIENTE</text>

    <rect x="100" y="${barY + barHeight + 14}" width="10" height="10" fill="#000" stroke="#000" stroke-width="1" />
    <text x="114" y="${barY + barHeight + 23}"
      font-family="'JetBrains Mono', monospace" font-size="9" fill="#000">CONFIRMADA</text>

    <rect x="220" y="${barY + barHeight + 14}" width="10" height="10" fill="#f0f0f0" stroke="#000" stroke-width="1" />
    <text x="234" y="${barY + barHeight + 23}"
      font-family="'JetBrains Mono', monospace" font-size="9" fill="#000">DENEGADA</text>
  `

  return `
    <svg width="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      ${html}
    </svg>
  `
}
