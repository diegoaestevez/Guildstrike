import type { EstadoPartida } from './tipos'

// Mensajes de error literales de backend/models. El adaptador en memoria los lanza igual que
// el backend y la interfaz los usa para explicar por qué una acción no está disponible.
// Si el modelo cambia un mensaje, se cambia aquí y en ningún otro lugar.
export const MENSAJES_DEL_MODELO = {
  // Torneo.js
  torneoNoAceptaInscripciones: 'El torneo no acepta inscripciones',
  equipoFueraDeRango: 'El equipo debe tener entre 4 y 9 integrantes',
  equipoYaInscrito: 'El equipo ya está inscrito',
  torneoYaNoActivo: 'El torneo ya no está activo',
  faltanEquipos: 'Se requieren al menos 4 equipos',
  rondaAnteriorIncompleta: 'La ronda anterior aún no está completa',
  // Partida.js
  seEsperabaEstado: (estado: EstadoPartida) => `Se esperaba estado ${estado}`,
  noPuedeFinalizarse: 'La partida no puede finalizarse en su estado actual',
  partidaNoAdmiteCambios: 'La partida no admite más cambios',
  capitanNoParticipa: 'El capitán no participa en esta partida',
  equipoYaReporto: 'El equipo ya reportó un resultado',
  evidenciaAntesDelFin: 'La evidencia sólo se recibe al finalizar la partida',
  evidenciaDeOtroEquipo: 'La evidencia debe asociarse al equipo del capitán',
  solicitanteNoParticipa: 'El solicitante no participa en la partida',
  partidaYaTieneDisputa: 'La partida ya tiene una disputa',
  // ReporteResultado.js
  reporteInvalido: 'El reporte de resultado es inválido',
  // Evidencia.js
  evidenciaMetadatosInvalidos: 'Los metadatos de evidencia son inválidos',
  evidenciaFormato: 'La evidencia debe ser PNG o JPG',
  evidenciaTamano: 'La evidencia excede el tamaño máximo permitido',
  evidenciaFueraDeTiempo: 'La evidencia está fuera del tiempo límite',
  // Disputa.js
  disputaDatosObligatorios: 'Partida, solicitante y motivo son obligatorios',
  ticketNoDisponible: 'El ticket ya no está disponible',
  ticketNoResoluble: 'El ticket no puede resolverse con esos datos',
  ganadorNoParticipa: 'El ganador debe participar en la partida',
  // Equipo.js, Usuario.js y Administrador.js
  usuarioYaRegistrado: 'El usuario ya está registrado',
  rosterLleno: 'El roster no puede exceder 9 integrantes',
  integranteYaEnEquipo: 'El integrante ya pertenece al equipo',
  integranteEnOtroEquipo: 'El integrante ya pertenece a otro equipo',
  datosDeUsuarioObligatorios: 'id, nombre y correo son obligatorios',
} as const

// Mensajes que no están en los modelos. Los dos primeros los agrega la capa de rutas de la API
// (permisos y recursos inexistentes); los demás cubren reglas de flujo que el modelo no tiene
// y que el contrato le pide al backend (ver CONTRATO-API.md, "Notas para el backend").
export const MENSAJES_FUERA_DEL_MODELO = {
  sinPermiso: 'No tienes permiso para esta acción',
  noExiste: (recurso: string) => `${recurso} no existe`,
  torneoSinRondas: 'El torneo todavía no tiene rondas: primero hay que cerrar inscripciones',
  torneoConCampeon: 'El torneo ya tiene campeón',
  partidaSinDisputa: 'La partida no tiene disputa',
  partidaYaTermino: 'La partida ya terminó',
  primeroTerminar: 'Primero hay que terminar la partida',
  marcadorNoEntero: 'Escribe los dos marcadores como números enteros, de 0 en adelante.',
  marcadorEmpatado: 'En eliminación simple no hay empates: el marcador tiene que tener un ganador.',
} as const
