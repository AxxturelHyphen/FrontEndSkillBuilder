// ============================================================
// config.js — Configuración de conexión a MongoDB Atlas
// ============================================================
// IMPORTANTE: No hardcodear credenciales en producción.
// Usar variables de entorno o un archivo .env excluido de git.
// ============================================================

const MONGODB_CONFIG = {
  // URL de la MongoDB Data API
  dataApiUrl: 'https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1',

  // Clave de API (reemplazar con la clave real)
  apiKey: 'YOUR_DATA_API_KEY',

  // Nombre del clúster en Atlas
  dataSource: 'Cluster0',

  // Base de datos
  database: 'skillbuilder',

  // Colección de solicitudes
  collection: 'solicitudes'
}

// Intervalo de polling en milisegundos (30 segundos)
const POLLING_INTERVAL = 30000

// Número máximo de documentos por consulta
const QUERY_LIMIT = 100

// Activar modo mock (datos de ejemplo) si no hay conexión
// Se establece automáticamente si la API no responde
let MOCK_MODE = false
