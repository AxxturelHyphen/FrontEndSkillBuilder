// ============================================================
// db-manager.js — SkillBuilder Database Manager
// ============================================================

// Configuración
const BACKEND_URL = 'http://localhost:3000/api';
const POLLING_INTERVAL = 30000;
const ITEMS_PER_PAGE = 20;

// Estado de la aplicación
let state = {
  coleccionActual: 'mentors',
  documentos: [],
  documentosFiltrados: [],
  paginaActual: 1,
  busqueda: '',
  mockMode: false,
  stats: {
    mentors: 0,
    projects: 0,
    tasks: 0,
    users: 0,
    resources: 0
  }
};

// Schemas de colecciones (para renderizar columnas)
const SCHEMAS = {
  mentors: ['_id', 'name', 'email', 'skills', 't_level', 'createdAt'],
  projects: ['_id', 'name', 'description', 'owner', 'workspaceId', 'taskCounts', 'startDate'],
  tasks: ['_id', 'title', 'status', 'projectId', 'mentorId', 'dueDate', 'createdAt'],
  users: ['_id', 'name', 'email', 'workspaceId', 'createdAt'],
  resources: ['_id', 'name', 'type', 'url', 'projectId', 'workspaceId']
};

// Datos mock para modo demo
const MOCK_DATA = {
  mentors: [
    { _id: '507f1f77bcf86cd799439011', name: 'Dr. Ada Lovelace', email: 'ada@skillbuilder.dev', skills: ['Python', 'Algorithm Design', 'Math'], t_level: 3, createdAt: '2025-01-15T10:30:00Z' },
    { _id: '507f1f77bcf86cd799439012', name: 'Alan Turing', email: 'alan@skillbuilder.dev', skills: ['Cryptography', 'Computing Theory'], t_level: 4, createdAt: '2025-01-12T14:20:00Z' },
    { _id: '507f1f77bcf86cd799439013', name: 'Grace Hopper', email: 'grace@skillbuilder.dev', skills: ['COBOL', 'Compilers', 'Navy'], t_level: 5, createdAt: '2025-01-10T09:15:00Z' }
  ],
  projects: [
    { _id: '507f1f77bcf86cd799439021', name: 'Analytical Engine', description: 'Build first general-purpose computer', owner: 'ada@skillbuilder.dev', workspaceId: 'ws001', taskCounts: { todo: 12, doing: 5, done: 23 }, startDate: '2025-01-01', createdAt: '2025-01-01T08:00:00Z' },
    { _id: '507f1f77bcf86cd799439022', name: 'Enigma Decryption', description: 'Break German encryption', owner: 'alan@skillbuilder.dev', workspaceId: 'ws001', taskCounts: { todo: 3, doing: 2, done: 45 }, startDate: '2025-01-05', createdAt: '2025-01-05T11:30:00Z' }
  ],
  tasks: [
    { _id: '507f1f77bcf86cd799439031', title: 'Design punch card system', status: 'done', projectId: '507f1f77bcf86cd799439021', mentorId: '507f1f77bcf86cd799439011', dueDate: '2025-02-01', createdAt: '2025-01-15T10:00:00Z' },
    { _id: '507f1f77bcf86cd799439032', title: 'Implement barrel shift', status: 'doing', projectId: '507f1f77bcf86cd799439021', mentorId: '507f1f77bcf86cd799439011', dueDate: '2025-02-10', createdAt: '2025-01-16T14:30:00Z' },
    { _id: '507f1f77bcf86cd799439033', title: 'Optimize bombe machine', status: 'todo', projectId: '507f1f77bcf86cd799439022', mentorId: '507f1f77bcf86cd799439012', dueDate: '2025-02-15', createdAt: '2025-01-18T09:00:00Z' },
    { _id: '507f1f77bcf86cd799439034', title: 'Test rotor configurations', status: 'done', projectId: '507f1f77bcf86cd799439022', mentorId: '507f1f77bcf86cd799439012', dueDate: '2025-01-25', createdAt: '2025-01-14T16:45:00Z' }
  ],
  users: [
    { _id: '507f1f77bcf86cd799439041', name: 'Charles Babbage', email: 'charles@skillbuilder.dev', workspaceId: 'ws001', createdAt: '2025-01-08T10:00:00Z' },
    { _id: '507f1f77bcf86cd799439042', name: 'Margaret Hamilton', email: 'margaret@skillbuilder.dev', workspaceId: 'ws001', createdAt: '2025-01-09T11:20:00Z' }
  ],
  resources: [
    { _id: '507f1f77bcf86cd799439051', name: 'Difference Engine Blueprints', type: 'PDF', url: 'https://docs.skillbuilder.dev/blueprints.pdf', projectId: '507f1f77bcf86cd799439021', workspaceId: 'ws001', createdAt: '2025-01-10T08:30:00Z' },
    { _id: '507f1f77bcf86cd799439052', name: 'Enigma Specifications', type: 'Document', url: 'https://docs.skillbuilder.dev/enigma.pdf', projectId: '507f1f77bcf86cd799439022', workspaceId: 'ws001', createdAt: '2025-01-11T14:15:00Z' }
  ]
};

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DB Manager] Iniciando aplicación...');

  // Configurar event listeners
  setupEventListeners();

  // Cargar datos iniciales
  await cargarDatos();

  // Iniciar polling
  setInterval(cargarDatos, POLLING_INTERVAL);
});

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Botones de selección de colección
  document.querySelectorAll('.filtros__btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const coleccion = e.target.dataset.coleccion;
      cambiarColeccion(coleccion);
    });
  });

  // Búsqueda
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('clear-btn');

  searchBtn.addEventListener('click', () => {
    state.busqueda = searchInput.value.toLowerCase();
    state.paginaActual = 1;
    aplicarFiltros();
    renderizarTabla();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.busqueda = '';
    state.paginaActual = 1;
    aplicarFiltros();
    renderizarTabla();
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });

  // Paginación
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (state.paginaActual > 1) {
      state.paginaActual--;
      renderizarTabla();
      actualizarPaginacion();
    }
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    const totalPaginas = Math.ceil(state.documentosFiltrados.length / ITEMS_PER_PAGE);
    if (state.paginaActual < totalPaginas) {
      state.paginaActual++;
      renderizarTabla();
      actualizarPaginacion();
    }
  });
}

// ============================================================
// CARGA DE DATOS
// ============================================================

async function cargarDatos() {
  console.log('[DB Manager] Cargando datos...');

  try {
    // Intentar cargar stats de todas las colecciones
    await cargarStats();

    // Cargar documentos de la colección actual
    await cargarDocumentos(state.coleccionActual);

    // Actualizar UI
    actualizarIndicadorConexion(true);
    actualizarUltimoRefresh();

  } catch (error) {
    console.error('[DB Manager] Error cargando datos:', error);
    activarModoMock();
  }
}

async function cargarStats() {
  for (const coleccion of Object.keys(state.stats)) {
    try {
      const response = await fetch(`${BACKEND_URL}/${coleccion}/count`);
      if (!response.ok) throw new Error('Backend no disponible');

      const data = await response.json();
      state.stats[coleccion] = data.count || 0;
    } catch (error) {
      // En caso de error, usar datos mock
      state.stats[coleccion] = MOCK_DATA[coleccion]?.length || 0;
    }
  }

  actualizarStatsUI();
}

async function cargarDocumentos(coleccion) {
  try {
    const response = await fetch(`${BACKEND_URL}/${coleccion}`);
    if (!response.ok) throw new Error('Backend no disponible');

    const data = await response.json();
    state.documentos = data.documents || data || [];

  } catch (error) {
    console.warn(`[DB Manager] Usando datos mock para ${coleccion}`);
    state.documentos = MOCK_DATA[coleccion] || [];
  }

  aplicarFiltros();
  renderizarTabla();
  renderizarGraficas();
}

// ============================================================
// CAMBIO DE COLECCIÓN
// ============================================================

function cambiarColeccion(coleccion) {
  state.coleccionActual = coleccion;
  state.paginaActual = 1;
  state.busqueda = '';
  document.getElementById('search-input').value = '';

  // Actualizar botones activos
  document.querySelectorAll('.filtros__btn').forEach(btn => {
    btn.classList.toggle('filtros__btn--activo', btn.dataset.coleccion === coleccion);
  });

  // Actualizar título de sección
  document.getElementById('coleccion-nombre').textContent = coleccion.toUpperCase();

  // Cargar documentos de la nueva colección
  cargarDocumentos(coleccion);
}

// ============================================================
// FILTROS Y BÚSQUEDA
// ============================================================

function aplicarFiltros() {
  state.documentosFiltrados = state.documentos;

  // Aplicar búsqueda si existe
  if (state.busqueda) {
    state.documentosFiltrados = state.documentos.filter(doc => {
      const searchableText = JSON.stringify(doc).toLowerCase();
      return searchableText.includes(state.busqueda);
    });
  }
}

// ============================================================
// RENDERIZADO
// ============================================================

function renderizarTabla() {
  const thead = document.getElementById('tabla-head');
  const tbody = document.getElementById('tabla-body');
  const schema = SCHEMAS[state.coleccionActual] || ['_id'];

  // Renderizar encabezados
  thead.innerHTML = `
    <tr>
      ${schema.map(campo => `<th>${campo.toUpperCase()}</th>`).join('')}
      <th>ACCIONES</th>
    </tr>
  `;

  // Calcular documentos para la página actual
  const inicio = (state.paginaActual - 1) * ITEMS_PER_PAGE;
  const fin = inicio + ITEMS_PER_PAGE;
  const documentosPagina = state.documentosFiltrados.slice(inicio, fin);

  // Renderizar filas
  if (documentosPagina.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${schema.length + 1}" class="tabla-vacia">
          NO HAY DOCUMENTOS QUE MOSTRAR
        </td>
      </tr>
    `;
    actualizarPaginacion();
    return;
  }

  tbody.innerHTML = documentosPagina.map(doc => {
    const celdas = schema.map(campo => {
      let valor = doc[campo];

      // Formatear valores especiales
      if (valor === null || valor === undefined) {
        return '<td>—</td>';
      }

      if (typeof valor === 'object' && !Array.isArray(valor)) {
        return `<td>${JSON.stringify(valor)}</td>`;
      }

      if (Array.isArray(valor)) {
        return `<td>${valor.join(', ')}</td>`;
      }

      if (campo === 'status') {
        return `<td><span class="badge ${valor === 'done' ? 'badge--activo' : 'badge--inactivo'}">${valor}</span></td>`;
      }

      // Truncar strings largos
      const valorStr = String(valor);
      const truncado = valorStr.length > 50 ? valorStr.substring(0, 47) + '...' : valorStr;

      return `<td>${truncado}</td>`;
    }).join('');

    return `
      <tr onclick="mostrarDetalle('${doc._id}')">
        ${celdas}
        <td>
          <button class="btn-accion" onclick="event.stopPropagation(); mostrarDetalle('${doc._id}')">VER</button>
        </td>
      </tr>
    `;
  }).join('');

  actualizarPaginacion();
}

function actualizarStatsUI() {
  document.getElementById('stat-mentors').textContent = state.stats.mentors;
  document.getElementById('stat-projects').textContent = state.stats.projects;
  document.getElementById('stat-tasks').textContent = state.stats.tasks;
  document.getElementById('stat-users').textContent = state.stats.users;
  document.getElementById('stat-resources').textContent = state.stats.resources;
}

function actualizarPaginacion() {
  const totalDocs = state.documentosFiltrados.length;
  const totalPaginas = Math.ceil(totalDocs / ITEMS_PER_PAGE);
  const inicio = (state.paginaActual - 1) * ITEMS_PER_PAGE + 1;
  const fin = Math.min(state.paginaActual * ITEMS_PER_PAGE, totalDocs);

  document.getElementById('pagina-actual').textContent = state.paginaActual;
  document.getElementById('documentos-desde').textContent = totalDocs > 0 ? inicio : 0;
  document.getElementById('documentos-hasta').textContent = fin;
  document.getElementById('documentos-total').textContent = totalDocs;

  document.getElementById('prev-btn').disabled = state.paginaActual <= 1;
  document.getElementById('next-btn').disabled = state.paginaActual >= totalPaginas || totalDocs === 0;
}

// ============================================================
// GRÁFICAS
// ============================================================

function renderizarGraficas() {
  renderizarGraficaEstados();
  renderizarGraficaActividad();
}

function renderizarGraficaEstados() {
  const container = document.getElementById('grafica-estados');

  if (state.coleccionActual !== 'tasks') {
    container.innerHTML = '<div style="padding: 20px; text-align: center; font-size: 11px; color: #999;">SOLO DISPONIBLE PARA TASKS</div>';
    return;
  }

  // Contar estados
  const estados = { todo: 0, doing: 0, done: 0 };
  state.documentos.forEach(task => {
    if (task.status && estados.hasOwnProperty(task.status)) {
      estados[task.status]++;
    }
  });

  const total = Object.values(estados).reduce((a, b) => a + b, 0);

  if (total === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center;">SIN DATOS</div>';
    return;
  }

  container.innerHTML = `
    <div class="chart-bar">
      ${Object.entries(estados).map(([estado, count]) => {
        const height = total > 0 ? (count / total) * 100 : 0;
        return `
          <div class="chart-bar__item" style="height: ${height}%">
            <div class="chart-bar__value">${count}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="display: flex; gap: 8px; justify-content: center; margin-top: 8px;">
      ${Object.keys(estados).map(estado =>
        `<div class="chart-bar__label">${estado.toUpperCase()}</div>`
      ).join('')}
    </div>
  `;
}

function renderizarGraficaActividad() {
  const container = document.getElementById('grafica-actividad');

  // Obtener documentos de los últimos 7 días
  const hoy = new Date();
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 7);

  const actividadPorDia = {};
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(hace7Dias);
    fecha.setDate(hace7Dias.getDate() + i);
    const key = fecha.toISOString().split('T')[0];
    actividadPorDia[key] = 0;
  }

  // Contar documentos por día
  state.documentos.forEach(doc => {
    if (doc.createdAt) {
      const fecha = new Date(doc.createdAt).toISOString().split('T')[0];
      if (actividadPorDia.hasOwnProperty(fecha)) {
        actividadPorDia[fecha]++;
      }
    }
  });

  const valores = Object.values(actividadPorDia);
  const maximo = Math.max(...valores, 1);

  container.innerHTML = `
    <div class="chart-bar">
      ${valores.map(count => {
        const height = (count / maximo) * 100;
        return `
          <div class="chart-bar__item" style="height: ${height}%">
            <div class="chart-bar__value">${count}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="display: flex; gap: 8px; justify-content: center; margin-top: 8px;">
      ${Object.keys(actividadPorDia).map(fecha => {
        const dia = new Date(fecha).getDate();
        return `<div class="chart-bar__label">${dia}</div>`;
      }).join('')}
    </div>
  `;
}

// ============================================================
// MODAL DE DETALLE
// ============================================================

function mostrarDetalle(docId) {
  const documento = state.documentosFiltrados.find(d => d._id === docId);
  if (!documento) return;

  const contenido = document.getElementById('detalle-contenido');

  // Renderizar todos los campos del documento
  contenido.innerHTML = Object.entries(documento).map(([key, value]) => {
    let valorFormateado = value;

    if (typeof value === 'object' && value !== null) {
      valorFormateado = `<div class="detalle-panel__valor--json">${JSON.stringify(value, null, 2)}</div>`;
    } else {
      valorFormateado = `<div class="detalle-panel__valor">${value || '—'}</div>`;
    }

    return `
      <div class="detalle-panel__campo">
        <div class="detalle-panel__label">${key}</div>
        ${valorFormateado}
      </div>
    `;
  }).join('');

  document.getElementById('detalle-overlay').classList.add('detalle-overlay--visible');
}

function cerrarDetalle() {
  document.getElementById('detalle-overlay').classList.remove('detalle-overlay--visible');
}

// ============================================================
// UI HELPERS
// ============================================================

function actualizarIndicadorConexion(conectado) {
  const indicador = document.getElementById('indicador-conexion');
  const texto = document.getElementById('texto-conexion');

  if (conectado) {
    indicador.classList.remove('header__indicador--desconectado');
    texto.textContent = 'CONECTADO';
  } else {
    indicador.classList.add('header__indicador--desconectado');
    texto.textContent = 'DESCONECTADO';
  }
}

function actualizarUltimoRefresh() {
  const ahora = new Date();
  const tiempo = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('ultimo-refresh').textContent = tiempo;
}

function activarModoMock() {
  console.warn('[DB Manager] Activando modo mock');
  state.mockMode = true;

  // Mostrar banner
  document.getElementById('mock-banner').style.display = 'block';

  // Cargar datos mock
  state.documentos = MOCK_DATA[state.coleccionActual] || [];

  // Actualizar stats con datos mock
  Object.keys(state.stats).forEach(coleccion => {
    state.stats[coleccion] = MOCK_DATA[coleccion]?.length || 0;
  });

  actualizarStatsUI();
  aplicarFiltros();
  renderizarTabla();
  renderizarGraficas();
  actualizarIndicadorConexion(false);
}

// ============================================================
// CARRUSEL DE CONSULTAS MONGODB
// ============================================================

const QUERY_SLIDES = [
  {
    title: 'PROYECTOS POR MENTOR',
    explanation: 'Consulta simple para encontrar todos los proyectos asociados a un mentor específico. Útil para ver la carga de trabajo de cada mentor y qué proyectos están bajo su supervisión.',
    query: `db.projects.find({
  "mentor.mentorId": "mentor_010"
})`,
    queryType: 'simple'
  },
  {
    title: 'RECURSOS POR PROYECTO',
    explanation: 'Buscar todos los recursos (documentos, PDFs, enlaces) vinculados a un proyecto específico. Permite organizar materiales de aprendizaje por proyecto.',
    query: `db.resources.find({
  projectId: "proj_007"
})`,
    queryType: 'simple'
  },
  {
    title: 'TAREAS PENDIENTES',
    explanation: 'Filtrar todas las tareas que aún no han sido iniciadas (estado TODO). Esencial para planificar el trabajo pendiente y priorizar tareas.',
    query: `db.tasks.find({
  status: "TODO"
})`,
    queryType: 'simple'
  },
  {
    title: 'TOP 10 PROYECTOS ACTIVOS',
    explanation: 'Agregación que identifica los 10 proyectos con mayor actividad basándose en el total de tareas completadas. Usa pipeline de agregación con múltiples etapas.',
    query: `db.projects.aggregate([
  {
    $match: {
      "taskCounts.done": { $gt: 0 }
    }
  },
  {
    $project: {
      name: 1,
      owner: 1,
      totalTasks: {
        $add: [
          "$taskCounts.todo",
          "$taskCounts.doing",
          "$taskCounts.done"
        ]
      },
      completedTasks: "$taskCounts.done"
    }
  },
  {
    $sort: { totalTasks: -1 }
  },
  {
    $limit: 10
  }
])`,
    queryType: 'aggregation'
  },
  {
    title: 'SKILLS AVANZADOS MÁS COMUNES',
    explanation: 'Agregación compleja que descompone el array de skills de cada mentor, filtra solo habilidades de nivel avanzado (≥ 3), y agrupa para contar cuáles son más frecuentes.',
    query: `db.mentors.aggregate([
  {
    $match: {
      t_level: { $gte: 3 }
    }
  },
  {
    $unwind: "$skills"
  },
  {
    $group: {
      _id: "$skills",
      count: { $sum: 1 },
      mentors: { $push: "$name" }
    }
  },
  {
    $sort: { count: -1 }
  }
])`,
    queryType: 'aggregation'
  },
  {
    title: 'TAREAS ORDENADAS POR FECHA',
    explanation: 'Agregación que filtra tareas con fecha de vencimiento, las proyecta con campos específicos, y las ordena por fecha más cercana. Limita a 10 resultados.',
    query: `db.tasks.aggregate([
  {
    $match: {
      dueDate: { $exists: true }
    }
  },
  {
    $project: {
      title: 1,
      status: 1,
      dueDate: 1,
      projectId: 1
    }
  },
  {
    $sort: { dueDate: -1 }
  },
  {
    $limit: 10
  }
])`,
    queryType: 'aggregation'
  }
];

// Estado del carrusel
let queryCarouselState = {
  currentSlide: 0,
  totalSlides: QUERY_SLIDES.length
};

// ============================================================
// FUNCIONES DEL CARRUSEL
// ============================================================

function setupQueryCarousel() {
  const btn = document.getElementById('cristina-btn');
  const overlay = document.getElementById('query-overlay');
  const closeBtn = document.getElementById('query-close-btn');
  const prevBtn = document.getElementById('query-prev-btn');
  const nextBtn = document.getElementById('query-next-btn');

  // Abrir carrusel
  btn.addEventListener('click', abrirQueryCarousel);

  // Cerrar carrusel
  closeBtn.addEventListener('click', cerrarQueryCarousel);

  // Cerrar al hacer click fuera del panel
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cerrarQueryCarousel();
    }
  });

  // Navegación
  prevBtn.addEventListener('click', previousSlide);
  nextBtn.addEventListener('click', nextSlide);

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('query-overlay--visible')) return;

    if (e.key === 'Escape') {
      cerrarQueryCarousel();
    } else if (e.key === 'ArrowLeft') {
      previousSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  });
}

function abrirQueryCarousel() {
  const overlay = document.getElementById('query-overlay');
  overlay.classList.add('query-overlay--visible');

  // Renderizar slides y dots
  renderQuerySlides();
  renderQueryDots();

  // Reset a primer slide
  queryCarouselState.currentSlide = 0;
  showSlide(0);
}

function cerrarQueryCarousel() {
  const overlay = document.getElementById('query-overlay');
  overlay.classList.remove('query-overlay--visible');
}

function renderQuerySlides() {
  const carousel = document.getElementById('query-carousel');

  // Mapeo de extensiones por índice (query-1.jpg, query-2.jpg, query-3.jpg, query-4.png, query-5.png, query-6.jpg)
  const imageExtensions = ['jpg', 'jpg', 'jpg', 'png', 'png', 'jpg'];

  carousel.innerHTML = QUERY_SLIDES.map((slide, index) => {
    const ext = imageExtensions[index];
    const imagePath = `images/query-${index + 1}.${ext}`;

    return `
      <div class="query-slide ${index === 0 ? 'query-slide--active' : ''}" data-slide="${index}">
        <h2 class="query-slide__title">${slide.title}</h2>

        <div class="query-slide__explanation">
          ${slide.explanation}
        </div>

        <div class="query-slide__code-label">CÓDIGO MONGODB:</div>
        <pre class="query-slide__code">${formatMongoQuery(slide.query)}</pre>

        <img src="${imagePath}" alt="${slide.title}" class="query-slide__image">
      </div>
    `;
  }).join('');
}

function formatMongoQuery(query) {
  // Syntax highlighting básico
  return query
    .replace(/\b(find|aggregate|match|project|sort|limit|group|unwind|add|sum|push|exists|gt|gte|lte)\b/g, '<span class="keyword">$1</span>')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    .replace(/(\$[a-zA-Z]+)/g, '<span class="operator">$1</span>');
}

function renderQueryDots() {
  const dotsContainer = document.getElementById('query-dots');

  dotsContainer.innerHTML = QUERY_SLIDES.map((_, index) => `
    <div class="query-dot ${index === 0 ? 'query-dot--active' : ''}"
         data-slide="${index}"
         onclick="goToSlide(${index})">
    </div>
  `).join('');
}

function updateQueryNavigation() {
  const { currentSlide, totalSlides } = queryCarouselState;

  // Actualizar botones
  document.getElementById('query-prev-btn').disabled = currentSlide === 0;
  document.getElementById('query-next-btn').disabled = currentSlide === totalSlides - 1;

  // Actualizar contador
  document.getElementById('query-current').textContent = currentSlide + 1;
  document.getElementById('query-total').textContent = totalSlides;

  // Actualizar dots
  document.querySelectorAll('.query-dot').forEach((dot, index) => {
    dot.classList.toggle('query-dot--active', index === currentSlide);
  });
}

function previousSlide() {
  if (queryCarouselState.currentSlide > 0) {
    queryCarouselState.currentSlide--;
    showSlide(queryCarouselState.currentSlide);
  }
}

function nextSlide() {
  if (queryCarouselState.currentSlide < queryCarouselState.totalSlides - 1) {
    queryCarouselState.currentSlide++;
    showSlide(queryCarouselState.currentSlide);
  }
}

function goToSlide(index) {
  queryCarouselState.currentSlide = index;
  showSlide(index);
}

function showSlide(index) {
  // Ocultar todos los slides
  document.querySelectorAll('.query-slide').forEach(slide => {
    slide.classList.remove('query-slide--active');
  });

  // Mostrar slide actual
  const activeSlide = document.querySelector(`.query-slide[data-slide="${index}"]`);
  if (activeSlide) {
    activeSlide.classList.add('query-slide--active');
  }

  // Actualizar navegación
  updateQueryNavigation();
}

// Inicializar carrusel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setupQueryCarousel();
});

// ============================================================
// EXPONER FUNCIONES GLOBALES
// ============================================================

window.mostrarDetalle = mostrarDetalle;
window.cerrarDetalle = cerrarDetalle;
window.abrirQueryCarousel = abrirQueryCarousel;
window.cerrarQueryCarousel = cerrarQueryCarousel;
window.goToSlide = goToSlide;

console.log('[DB Manager] Aplicación lista');
