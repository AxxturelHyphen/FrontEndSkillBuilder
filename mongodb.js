// ============================================================
// mongodb.js — Capa de acceso a datos (MongoDB Data API)
// ============================================================

// Datos de ejemplo para cuando no hay conexión a MongoDB
const MOCK_SOLICITUDES = [
  {
    _id: 'mock_001',
    idTelegram: '111222333',
    nombreCliente: 'Ana García',
    telefonoCliente: '+34 612 345 678',
    servicio: 'Corte + tinte',
    fechaSolicitada: '2025-02-15',
    horaSolicitada: '11:00',
    estado: 'pendiente',
    mensajeOriginal: 'Hola, quiero pedir cita para el viernes a las 11',
    fechaCreacion: '2025-02-10T09:23:11Z',
    fechaActualizacion: null
  },
  {
    _id: 'mock_002',
    idTelegram: '444555666',
    nombreCliente: 'Carlos Ruiz',
    telefonoCliente: '+34 698 765 432',
    servicio: 'Corte caballero',
    fechaSolicitada: '2025-02-14',
    horaSolicitada: '10:30',
    estado: 'confirmada',
    mensajeOriginal: 'Buenos días, me gustaría cortarme el pelo el jueves a las 10:30',
    fechaCreacion: '2025-02-09T14:05:22Z',
    fechaActualizacion: '2025-02-09T15:00:00Z'
  },
  {
    _id: 'mock_003',
    idTelegram: '777888999',
    nombreCliente: 'María López',
    telefonoCliente: '+34 655 111 222',
    servicio: 'Mechas + corte',
    fechaSolicitada: '2025-02-16',
    horaSolicitada: '09:00',
    estado: 'pendiente',
    mensajeOriginal: 'Quiero hacerme mechas y corte el sábado temprano',
    fechaCreacion: '2025-02-10T08:12:45Z',
    fechaActualizacion: null
  },
  {
    _id: 'mock_004',
    idTelegram: '101112131',
    nombreCliente: 'Pedro Sánchez',
    telefonoCliente: '+34 677 333 444',
    servicio: 'Afeitado',
    fechaSolicitada: '2025-02-13',
    horaSolicitada: '17:00',
    estado: 'denegada',
    mensajeOriginal: 'Necesito un afeitado para el miércoles por la tarde',
    fechaCreacion: '2025-02-08T11:30:00Z',
    fechaActualizacion: '2025-02-08T12:00:00Z'
  },
  {
    _id: 'mock_005',
    idTelegram: '141516171',
    nombreCliente: 'Laura Fernández',
    telefonoCliente: '+34 622 555 666',
    servicio: 'Tinte completo',
    fechaSolicitada: '2025-02-17',
    horaSolicitada: '12:00',
    estado: 'pendiente',
    mensajeOriginal: 'Hola! Quiero teñirme el lunes a mediodía',
    fechaCreacion: '2025-02-10T10:45:33Z',
    fechaActualizacion: null
  },
  {
    _id: 'mock_006',
    idTelegram: '181920212',
    nombreCliente: 'Javier Moreno',
    telefonoCliente: '+34 633 777 888',
    servicio: 'Corte + barba',
    fechaSolicitada: '2025-02-14',
    horaSolicitada: '16:00',
    estado: 'confirmada',
    mensajeOriginal: 'Me gustaría corte y arreglo de barba el jueves a las 4',
    fechaCreacion: '2025-02-09T09:15:00Z',
    fechaActualizacion: '2025-02-09T10:00:00Z'
  },
  {
    _id: 'mock_007',
    idTelegram: '222324252',
    nombreCliente: 'Sofía Martín',
    telefonoCliente: '+34 644 999 000',
    servicio: 'Peinado evento',
    fechaSolicitada: '2025-02-18',
    horaSolicitada: '10:00',
    estado: 'confirmada',
    mensajeOriginal: 'Necesito un peinado para una boda el martes a las 10',
    fechaCreacion: '2025-02-10T07:00:00Z',
    fechaActualizacion: '2025-02-10T08:00:00Z'
  },
  {
    _id: 'mock_008',
    idTelegram: '262728293',
    nombreCliente: 'Diego Torres',
    telefonoCliente: '+34 611 222 333',
    servicio: 'Corte degradado',
    fechaSolicitada: '2025-02-15',
    horaSolicitada: '14:00',
    estado: 'pendiente',
    mensajeOriginal: 'Quiero un degradado para el viernes por la tarde',
    fechaCreacion: '2025-02-10T11:20:00Z',
    fechaActualizacion: null
  },
  {
    _id: 'mock_009',
    idTelegram: '303132333',
    nombreCliente: 'Elena Navarro',
    telefonoCliente: '+34 655 444 555',
    servicio: 'Tratamiento keratina',
    fechaSolicitada: '2025-02-19',
    horaSolicitada: '11:30',
    estado: 'pendiente',
    mensajeOriginal: 'Hola, quiero un tratamiento de keratina el miércoles',
    fechaCreacion: '2025-02-10T12:00:00Z',
    fechaActualizacion: null
  },
  {
    _id: 'mock_010',
    idTelegram: '343536373',
    nombreCliente: 'Roberto Díaz',
    telefonoCliente: '+34 677 666 777',
    servicio: 'Corte caballero',
    fechaSolicitada: '2025-02-12',
    horaSolicitada: '09:30',
    estado: 'denegada',
    mensajeOriginal: 'Corte de pelo mañana a primera hora si es posible',
    fechaCreacion: '2025-02-07T16:40:00Z',
    fechaActualizacion: '2025-02-07T17:00:00Z'
  },
  {
    _id: 'mock_011',
    idTelegram: '383940414',
    nombreCliente: 'Isabel Castro',
    telefonoCliente: '+34 699 888 111',
    servicio: 'Corte + mechas',
    fechaSolicitada: '2025-02-20',
    horaSolicitada: '15:00',
    estado: 'confirmada',
    mensajeOriginal: 'Quiero corte y mechas el jueves a las 3 de la tarde',
    fechaCreacion: '2025-02-10T13:10:00Z',
    fechaActualizacion: '2025-02-10T14:00:00Z'
  },
  {
    _id: 'mock_012',
    idTelegram: '424344454',
    nombreCliente: 'Fernando Gil',
    telefonoCliente: '+34 622 333 444',
    servicio: 'Afeitado clásico',
    fechaSolicitada: '2025-02-14',
    horaSolicitada: '13:00',
    estado: 'pendiente',
    mensajeOriginal: 'Un afeitado clásico para el jueves al mediodía',
    fechaCreacion: '2025-02-10T14:30:00Z',
    fechaActualizacion: null
  }
]

/**
 * Verificar si la API de MongoDB está disponible
 * Retorna true si conecta, false si no
 */
async function verificarConexion() {
  // Si las credenciales no están configuradas, usar modo mock
  if (MONGODB_CONFIG.apiKey === 'YOUR_DATA_API_KEY' ||
      MONGODB_CONFIG.dataApiUrl.includes('YOUR_APP_ID')) {
    return false
  }

  try {
    const res = await fetch(`${MONGODB_CONFIG.dataApiUrl}/action/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_CONFIG.apiKey
      },
      body: JSON.stringify({
        dataSource: MONGODB_CONFIG.dataSource,
        database: MONGODB_CONFIG.database,
        collection: MONGODB_CONFIG.collection,
        filter: {},
        limit: 1
      })
    })
    return res.ok
  } catch (e) {
    return false
  }
}

/**
 * Obtener todas las solicitudes, opcionalmente filtradas por estado
 * @param {string|null} filtroEstado - 'pendiente', 'confirmada', 'denegada' o null para todas
 * @returns {Array} Lista de solicitudes
 */
async function fetchSolicitudes(filtroEstado = null) {
  if (MOCK_MODE) {
    // En modo mock, filtrar los datos de ejemplo
    if (filtroEstado) {
      return MOCK_SOLICITUDES.filter(s => s.estado === filtroEstado)
    }
    return [...MOCK_SOLICITUDES]
  }

  const filter = filtroEstado ? { estado: filtroEstado } : {}

  try {
    const res = await fetch(`${MONGODB_CONFIG.dataApiUrl}/action/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_CONFIG.apiKey
      },
      body: JSON.stringify({
        dataSource: MONGODB_CONFIG.dataSource,
        database: MONGODB_CONFIG.database,
        collection: MONGODB_CONFIG.collection,
        filter,
        sort: { fechaCreacion: -1 },
        limit: QUERY_LIMIT
      })
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.documents
  } catch (e) {
    console.error('[ERROR] fetchSolicitudes:', e.message)
    return []
  }
}

/**
 * Actualizar el estado de una solicitud
 * @param {string} id - ObjectId de la solicitud
 * @param {string} nuevoEstado - 'confirmada' o 'denegada'
 * @returns {Object} Resultado de la operación
 */
async function actualizarEstado(id, nuevoEstado) {
  if (MOCK_MODE) {
    // En modo mock, actualizar el array local
    const solicitud = MOCK_SOLICITUDES.find(s => s._id === id)
    if (solicitud) {
      solicitud.estado = nuevoEstado
      solicitud.fechaActualizacion = new Date().toISOString()
    }
    return { matchedCount: 1, modifiedCount: 1 }
  }

  try {
    const res = await fetch(`${MONGODB_CONFIG.dataApiUrl}/action/updateOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_CONFIG.apiKey
      },
      body: JSON.stringify({
        dataSource: MONGODB_CONFIG.dataSource,
        database: MONGODB_CONFIG.database,
        collection: MONGODB_CONFIG.collection,
        filter: { _id: { $oid: id } },
        update: {
          $set: {
            estado: nuevoEstado,
            fechaActualizacion: new Date().toISOString()
          }
        }
      })
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('[ERROR] actualizarEstado:', e.message)
    throw e
  }
}
