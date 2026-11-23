// Tipos del dominio, espejo de backend/models. Los estados, roles y tipos de evento
// se escriben igual que en el backend para que un dato viaje sin traducción.
// Esta capa no conoce React, fetch ni ninguna librería: solo datos y reglas.

export type Rol = 'ADMINISTRADOR' | 'CAPITAN' | 'ARBITRO' | 'INTEGRANTE'

export type EstadoTorneo = 'ACTIVO' | 'EN_CURSO'

// Torneo.js delega los emparejamientos en una subclase por formato (R-02);
// hoy solo existe TorneoEliminacionSimple.
export type FormatoTorneo = 'ELIMINACION_SIMPLE'

export type EstadoPartida = 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CONGELADA' | 'AUDITADA'

export type EstadoDisputa = 'ABIERTO' | 'RESUELTO'

export type TipoEvento =
  | 'PARTIDA_INICIADA'
  | 'RESULTADO_REPORTADO'
  | 'RESULTADO_VALIDADO'
  | 'EVIDENCIA_AGREGADA'
  | 'DISPUTA_ABIERTA'
  | 'DICTAMEN_EMITIDO'

/** Referencia a una persona: id y el nombre con que se muestra. */
export interface PersonaRef {
  id: string
  nombre: string
}

/** Referencia a un equipo: id y nombre (RF-14 pide el nombre en las llaves). */
export interface EquipoRef {
  id: string
  nombre: string
}

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  /** Equipo que representa (capitán) o al que pertenece (integrante); null para administrador y árbitro. */
  equipo: EquipoRef | null
}

export interface Integrante {
  id: string
  nombre: string
  correo: string
}

export interface Equipo {
  id: string
  nombre: string
  capitan: PersonaRef
  /** El capitán no cuenta en el roster: Equipo.integrantes del backend no lo incluye. */
  integrantes: Integrante[]
}

/** Equipo tal como aparece inscrito en un torneo. */
export interface EquipoInscrito extends EquipoRef {
  capitanId: string
  totalIntegrantes: number
}

/** Marcador validado, en el orden de `partida.equipos`. */
export interface Marcador {
  equipoA: number
  equipoB: number
}

export interface PartidaResumen {
  id: string
  torneoId: string
  ronda: number
  equipos: readonly [EquipoRef, EquipoRef]
  estado: EstadoPartida
  fechaProgramada: Date
  fechaFin: Date | null
  ganadorId: string | null
  /** Solo existe cuando los dos capitanes coincidieron (RF-05); un dictamen decide ganador sin marcador. */
  marcador: Marcador | null
}

export interface Ronda {
  numero: number
  partidas: PartidaResumen[]
  /** Equipo impar que pasa directo a la siguiente ronda (TorneoEliminacionSimple). */
  paseAutomatico: EquipoRef | null
}

export interface TorneoResumen {
  id: string
  nombre: string
  estado: EstadoTorneo
  formato: FormatoTorneo
  equiposInscritos: number
  rondaActual: number | null
}

export interface Torneo {
  id: string
  nombre: string
  estado: EstadoTorneo
  formato: FormatoTorneo
  equipos: EquipoInscrito[]
  rondas: Ronda[]
}

export interface Reporte {
  equipoId: string
  capitanId: string
  marcadorPropio: number
  marcadorRival: number
  fecha: Date
}

export interface Evidencia {
  equipoId: string
  nombre: string
  tipo: string
  tamanoBytes: number
  fechaCarga: Date
  /** Dirección para ver la imagen; null si la fuente no la conserva. */
  url: string | null
}

export interface Disputa {
  solicitante: PersonaRef
  motivo: string
  estado: EstadoDisputa
  arbitro: PersonaRef | null
  equipoGanadorId: string | null
  justificacion: string | null
  fechaCreacion: Date
  fechaResolucion: Date | null
}

export interface EventoPartida {
  tipo: TipoEvento
  /** Quién lo provocó; null cuando lo registra el sistema (por ejemplo, al validar marcadores). */
  usuario: PersonaRef | null
  descripcion: string
  fecha: Date
}

export interface Partida extends PartidaResumen {
  torneoNombre: string
  reportes: Reporte[]
  evidencias: Evidencia[]
  /** Una partida tiene a lo sumo una disputa; por eso la disputa se identifica por su partida. */
  disputa: Disputa | null
  eventos: EventoPartida[]
}

/** Lo que el árbitro ve en su bandeja de disputas. */
export interface DisputaResumen {
  partidaId: string
  torneoId: string
  torneoNombre: string
  ronda: number
  equipos: readonly [EquipoRef, EquipoRef]
  motivo: string
  solicitante: PersonaRef
  arbitro: PersonaRef | null
  estado: EstadoDisputa
  fechaCreacion: Date
}
