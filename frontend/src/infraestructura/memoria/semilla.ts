import type { DatosEnMemoria, RegistroEquipo, RegistroPartida, RegistroTorneo, RegistroUsuario } from './almacen'

// Datos de demostración. Personas y equipos ficticios. Las fechas se calculan a partir de
// `ahora` para que la línea de tiempo y los horarios se vean recientes al abrir la app.
//
// Copa Relámpago (EN_CURSO), ronda 1: una partida en cada estado más un pase automático.
//   1-1 AUDITADA    Halcones Nocturnos vs Colmena Roja    (reportes distintos, dictamen)
//   1-2 FINALIZADA  Vértice Gaming vs Kraken Azul         (los capitanes coincidieron)
//   1-3 CONGELADA   Nómadas del Sur vs Pixel Brigada      (disputa abierta, sin árbitro)
//   1-4 EN_CURSO    Furia Austral vs Eclipse Tapatío
//   1-5 PROGRAMADA  Zafiro Clan vs Titanes de Hierro
//   pase automático: Lobos de Tlaquepaque
// Liga Universitaria (ACTIVO): tres equipos inscritos, le falta uno para cerrar.
// Brújula Negra no está inscrita y tiene 3 integrantes: le falta uno para poder inscribirse.

const MINUTO = 60_000
const MB = 1024 * 1024

const NOMBRES = [
  'Alejandra', 'Bruno', 'Carla', 'Darío', 'Elena', 'Fabián', 'Gabriela', 'Héctor', 'Iván', 'Julia',
  'Karla', 'Lorenzo', 'Mónica', 'Néstor', 'Olivia', 'Pablo', 'Regina', 'Samuel', 'Tania', 'Ulises',
  'Vanessa', 'Wendy', 'Yahir', 'Zoe', 'Adrián', 'Bianca', 'César', 'Dulce', 'Esteban', 'Frida',
]
const APELLIDOS = [
  'Aguilar', 'Benavides', 'Carrillo', 'Delgado', 'Escobedo', 'Figueroa', 'Galindo', 'Hinojosa', 'Islas', 'Jiménez',
  'Lara', 'Maldonado', 'Navarro', 'Ocampo', 'Padilla', 'Quintero', 'Rangel', 'Salazar', 'Tapia', 'Uribe',
  'Valdez', 'Zamora', 'Acosta', 'Bermúdez', 'Cervantes', 'Durán', 'Espinoza', 'Fuentes', 'Gallardo', 'Huerta',
]

const sinAcentos = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const correoDe = (nombre: string) => `${sinAcentos(nombre).replace(/\s+/g, '.')}@guildstrike.test`

interface DefinicionEquipo {
  clave: string
  nombre: string
  capitan: string
  integrantes: number
}

const EQUIPOS: DefinicionEquipo[] = [
  { clave: 'halcones', nombre: 'Halcones Nocturnos', capitan: 'Valeria Montaño', integrantes: 5 },
  { clave: 'colmena', nombre: 'Colmena Roja', capitan: 'Emiliano Cárdenas', integrantes: 6 },
  { clave: 'vertice', nombre: 'Vértice Gaming', capitan: 'Ximena Robles', integrantes: 5 },
  { clave: 'kraken', nombre: 'Kraken Azul', capitan: 'Joaquín Treviño', integrantes: 4 },
  { clave: 'nomadas', nombre: 'Nómadas del Sur', capitan: 'Renata Quiroz', integrantes: 5 },
  { clave: 'pixel', nombre: 'Pixel Brigada', capitan: 'Mateo Castañeda', integrantes: 7 },
  { clave: 'furia', nombre: 'Furia Austral', capitan: 'Camila Ibarra', integrantes: 5 },
  { clave: 'eclipse', nombre: 'Eclipse Tapatío', capitan: 'Leonardo Fajardo', integrantes: 5 },
  { clave: 'zafiro', nombre: 'Zafiro Clan', capitan: 'Daniela Orozco', integrantes: 4 },
  { clave: 'titanes', nombre: 'Titanes de Hierro', capitan: 'Sebastián Medina', integrantes: 6 },
  { clave: 'lobos', nombre: 'Lobos de Tlaquepaque', capitan: 'Andrea Villalobos', integrantes: 5 },
  { clave: 'brujula', nombre: 'Brújula Negra', capitan: 'Fernanda Llamas', integrantes: 3 },
]

export const ID_ADMINISTRADOR = 'adm-ochoa'
export const ID_ARBITRO = 'arb-saldana'
export const capitanDe = (clave: string) => `cap-${clave}`
export const equipoDe = (clave: string) => `eq-${clave}`

function crearPersonas(): { usuarios: RegistroUsuario[]; equipos: RegistroEquipo[] } {
  const usuarios: RegistroUsuario[] = [
    { id: ID_ADMINISTRADOR, nombre: 'Mariana Ochoa', correo: correoDe('Mariana Ochoa'), rol: 'ADMINISTRADOR', equipoId: null },
    { id: ID_ARBITRO, nombre: 'Rodrigo Saldaña', correo: correoDe('Rodrigo Saldaña'), rol: 'ARBITRO', equipoId: null },
  ]
  const equipos: RegistroEquipo[] = []
  let indice = 0
  for (const definicion of EQUIPOS) {
    const equipoId = equipoDe(definicion.clave)
    const capitanId = capitanDe(definicion.clave)
    usuarios.push({ id: capitanId, nombre: definicion.capitan, correo: correoDe(definicion.capitan), rol: 'CAPITAN', equipoId })
    const integranteIds: string[] = []
    for (let numero = 1; numero <= definicion.integrantes; numero += 1) {
      const nombre = `${NOMBRES[indice % NOMBRES.length]} ${APELLIDOS[(indice * 7 + Math.floor(indice / NOMBRES.length)) % APELLIDOS.length]}`
      const id = `int-${definicion.clave}-${numero}`
      usuarios.push({ id, nombre, correo: correoDe(nombre), rol: 'INTEGRANTE', equipoId })
      integranteIds.push(id)
      indice += 1
    }
    equipos.push({ id: equipoId, nombre: definicion.nombre, capitanId, integranteIds })
  }
  return { usuarios, equipos }
}

function partidaVacia(id: string, torneoId: string, a: string, b: string, fechaProgramada: Date): RegistroPartida {
  return {
    id,
    torneoId,
    ronda: 1,
    equipoIds: [equipoDe(a), equipoDe(b)],
    estado: 'PROGRAMADA',
    fechaProgramada,
    fechaFin: null,
    reportes: [],
    evidencias: [],
    disputa: null,
    ganadorId: null,
    eventos: [],
  }
}

export function crearSemilla(ahora: Date): DatosEnMemoria {
  const en = (minutos: number) => new Date(ahora.getTime() + minutos * MINUTO)
  const { usuarios, equipos } = crearPersonas()
  const copa = 'copa-relampago'

  // 1-1 AUDITADA: los dos capitanes se dieron la victoria; el árbitro revisó las capturas.
  const auditada = partidaVacia(`${copa}-1-1`, copa, 'halcones', 'colmena', en(-240))
  const finAuditada = en(-195)
  Object.assign(auditada, {
    estado: 'AUDITADA',
    fechaFin: finAuditada,
    ganadorId: equipoDe('halcones'),
    reportes: [
      { equipoId: equipoDe('halcones'), capitanId: capitanDe('halcones'), marcadorPropio: 2, marcadorRival: 1, fecha: en(-191) },
      { equipoId: equipoDe('colmena'), capitanId: capitanDe('colmena'), marcadorPropio: 2, marcadorRival: 1, fecha: en(-190) },
    ],
    evidencias: [
      { equipoId: equipoDe('halcones'), capitanId: capitanDe('halcones'), nombre: 'halcones-marcador-final.png', tipo: 'image/png', tamanoBytes: Math.round(1.8 * MB), fechaCarga: en(-194), url: null },
      { equipoId: equipoDe('colmena'), capitanId: capitanDe('colmena'), nombre: 'colmena-pantalla-final.jpg', tipo: 'image/jpeg', tamanoBytes: Math.round(0.9 * MB), fechaCarga: en(-192), url: null },
    ],
    disputa: {
      solicitanteId: capitanDe('colmena'),
      motivo: 'Marcadores discrepantes',
      estado: 'RESUELTO',
      arbitroId: ID_ARBITRO,
      equipoGanadorId: equipoDe('halcones'),
      justificacion: 'Las dos capturas muestran 2-1 a favor de Halcones Nocturnos al cierre del tercer mapa; el reporte de Colmena Roja invirtió el resultado.',
      fechaCreacion: en(-190),
      fechaResolucion: en(-150),
    },
    eventos: [
      { tipo: 'PARTIDA_INICIADA', usuarioId: null, descripcion: 'La partida inició', fecha: en(-238) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('halcones'), descripcion: 'halcones-marcador-final.png', fecha: en(-194) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('colmena'), descripcion: 'colmena-pantalla-final.jpg', fecha: en(-192) },
      { tipo: 'RESULTADO_REPORTADO', usuarioId: capitanDe('halcones'), descripcion: 'Marcador de Halcones Nocturnos', fecha: en(-191) },
      { tipo: 'RESULTADO_REPORTADO', usuarioId: capitanDe('colmena'), descripcion: 'Marcador de Colmena Roja', fecha: en(-190) },
      { tipo: 'DISPUTA_ABIERTA', usuarioId: capitanDe('colmena'), descripcion: 'Marcadores discrepantes', fecha: en(-190) },
      { tipo: 'DICTAMEN_EMITIDO', usuarioId: ID_ARBITRO, descripcion: 'Las dos capturas muestran 2-1 a favor de Halcones Nocturnos al cierre del tercer mapa; el reporte de Colmena Roja invirtió el resultado.', fecha: en(-150) },
    ],
  } satisfies Partial<RegistroPartida>)

  // 1-2 FINALIZADA: los dos reportes coinciden, 2-1 para Vértice.
  const finalizada = partidaVacia(`${copa}-1-2`, copa, 'vertice', 'kraken', en(-180))
  Object.assign(finalizada, {
    estado: 'FINALIZADA',
    fechaFin: en(-128),
    ganadorId: equipoDe('vertice'),
    reportes: [
      { equipoId: equipoDe('vertice'), capitanId: capitanDe('vertice'), marcadorPropio: 2, marcadorRival: 1, fecha: en(-125) },
      { equipoId: equipoDe('kraken'), capitanId: capitanDe('kraken'), marcadorPropio: 1, marcadorRival: 2, fecha: en(-124) },
    ],
    evidencias: [
      { equipoId: equipoDe('vertice'), capitanId: capitanDe('vertice'), nombre: 'vertice-resultado.png', tipo: 'image/png', tamanoBytes: Math.round(2.4 * MB), fechaCarga: en(-127), url: null },
      { equipoId: equipoDe('kraken'), capitanId: capitanDe('kraken'), nombre: 'kraken-resumen.jpg', tipo: 'image/jpeg', tamanoBytes: Math.round(1.1 * MB), fechaCarga: en(-126), url: null },
    ],
    eventos: [
      { tipo: 'PARTIDA_INICIADA', usuarioId: null, descripcion: 'La partida inició', fecha: en(-178) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('vertice'), descripcion: 'vertice-resultado.png', fecha: en(-127) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('kraken'), descripcion: 'kraken-resumen.jpg', fecha: en(-126) },
      { tipo: 'RESULTADO_REPORTADO', usuarioId: capitanDe('vertice'), descripcion: 'Marcador de Vértice Gaming', fecha: en(-125) },
      { tipo: 'RESULTADO_REPORTADO', usuarioId: capitanDe('kraken'), descripcion: 'Marcador de Kraken Azul', fecha: en(-124) },
      { tipo: 'RESULTADO_VALIDADO', usuarioId: null, descripcion: 'Los capitanes coincidieron', fecha: en(-124) },
    ],
  } satisfies Partial<RegistroPartida>)

  // 1-3 CONGELADA: un reporte y una disputa abierta por el rival, sin árbitro todavía.
  const motivoPixel = 'Nómadas reportó 2-0, pero el segundo mapa se repitió por una caída del servidor y lo ganamos nosotros. La captura lo muestra.'
  const congelada = partidaVacia(`${copa}-1-3`, copa, 'nomadas', 'pixel', en(-120))
  Object.assign(congelada, {
    estado: 'CONGELADA',
    fechaFin: en(-62),
    reportes: [
      { equipoId: equipoDe('nomadas'), capitanId: capitanDe('nomadas'), marcadorPropio: 2, marcadorRival: 0, fecha: en(-59) },
    ],
    evidencias: [
      { equipoId: equipoDe('nomadas'), capitanId: capitanDe('nomadas'), nombre: 'nomadas-victoria.png', tipo: 'image/png', tamanoBytes: Math.round(3.2 * MB), fechaCarga: en(-61), url: null },
      { equipoId: equipoDe('pixel'), capitanId: capitanDe('pixel'), nombre: 'pixel-mapa-repetido.jpg', tipo: 'image/jpeg', tamanoBytes: Math.round(1.4 * MB), fechaCarga: en(-60), url: null },
    ],
    disputa: {
      solicitanteId: capitanDe('pixel'),
      motivo: motivoPixel,
      estado: 'ABIERTO',
      arbitroId: null,
      equipoGanadorId: null,
      justificacion: null,
      fechaCreacion: en(-58),
      fechaResolucion: null,
    },
    eventos: [
      { tipo: 'PARTIDA_INICIADA', usuarioId: null, descripcion: 'La partida inició', fecha: en(-118) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('nomadas'), descripcion: 'nomadas-victoria.png', fecha: en(-61) },
      { tipo: 'EVIDENCIA_AGREGADA', usuarioId: capitanDe('pixel'), descripcion: 'pixel-mapa-repetido.jpg', fecha: en(-60) },
      { tipo: 'RESULTADO_REPORTADO', usuarioId: capitanDe('nomadas'), descripcion: 'Marcador de Nómadas del Sur', fecha: en(-59) },
      { tipo: 'DISPUTA_ABIERTA', usuarioId: capitanDe('pixel'), descripcion: motivoPixel, fecha: en(-58) },
    ],
  } satisfies Partial<RegistroPartida>)

  // 1-4 EN_CURSO: se está jugando; nadie la ha terminado.
  const enCurso = partidaVacia(`${copa}-1-4`, copa, 'furia', 'eclipse', en(-30))
  Object.assign(enCurso, {
    estado: 'EN_CURSO',
    eventos: [{ tipo: 'PARTIDA_INICIADA', usuarioId: null, descripcion: 'La partida inició', fecha: en(-27) }],
  } satisfies Partial<RegistroPartida>)

  // 1-5 PROGRAMADA: empieza en una hora.
  const programada = partidaVacia(`${copa}-1-5`, copa, 'zafiro', 'titanes', en(60))

  const claves = ['halcones', 'colmena', 'vertice', 'kraken', 'nomadas', 'pixel', 'furia', 'eclipse', 'zafiro', 'titanes', 'lobos']
  const torneos: RegistroTorneo[] = [
    {
      id: copa,
      nombre: 'Copa Relámpago Otoño 2026',
      estado: 'EN_CURSO',
      formato: 'ELIMINACION_SIMPLE',
      equipoIds: claves.map(equipoDe),
      rondas: [
        {
          numero: 1,
          partidaIds: [auditada.id, finalizada.id, congelada.id, enCurso.id, programada.id],
          paseAutomaticoId: equipoDe('lobos'),
        },
      ],
    },
    {
      id: 'liga-invierno',
      nombre: 'Liga Universitaria Invierno 2026',
      estado: 'ACTIVO',
      formato: 'ELIMINACION_SIMPLE',
      equipoIds: ['colmena', 'nomadas', 'lobos'].map(equipoDe),
      rondas: [],
    },
  ]

  return { usuarios, equipos, torneos, partidas: [auditada, finalizada, congelada, enCurso, programada] }
}
