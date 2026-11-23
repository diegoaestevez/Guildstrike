import type {
  DisputaResumen,
  Equipo,
  EstadoDisputa,
  Partida,
  Torneo,
  TorneoResumen,
  Usuario,
} from '../dominio/tipos'

// Puertos de salida: lo que la interfaz necesita de una fuente de datos, sin decir cuál.
// Uno por agregado (ISP): una pantalla depende solo de los que usa, y un adaptador nuevo
// puede implementarlos por separado. Las dos implementaciones viven en infraestructura/.
//
// Reglas de todos los puertos:
// - Toda operación que hace una persona recibe primero `actorId`: quién la hace.
// - Las operaciones que cambian algo devuelven el agregado ya actualizado.
// - Si el dominio rechaza la operación, la promesa se rechaza con ErrorDeRegla y el mensaje
//   literal del modelo; si la fuente no responde, con ErrorDeConexion (aplicacion/errores.ts).

export interface RepositorioUsuarios {
  listar(): Promise<Usuario[]>
}

export interface RepositorioTorneos {
  listar(): Promise<TorneoResumen[]>
  obtener(torneoId: string): Promise<Torneo>
  /** RF-01: el capitán inscribe a su equipo en un torneo activo. */
  inscribirEquipo(actorId: string, torneoId: string, equipoId: string): Promise<Torneo>
  /** RF-02: cierra inscripciones y genera la ronda 1. */
  cerrarInscripciones(actorId: string, torneoId: string): Promise<Torneo>
  generarSiguienteRonda(actorId: string, torneoId: string): Promise<Torneo>
}

/** Archivo de evidencia tal como lo entrega el formulario (un File es un Blob). */
export interface ArchivoEvidencia {
  nombre: string
  tipo: string
  tamanoBytes: number
  contenido: Blob
}

export interface ReporteDeMarcador {
  marcadorPropio: number
  marcadorRival: number
}

export interface RepositorioPartidas {
  obtener(partidaId: string): Promise<Partida>
  iniciar(actorId: string, partidaId: string): Promise<Partida>
  /** Fija la fecha de fin, que abre la ventana de evidencia. */
  terminar(actorId: string, partidaId: string): Promise<Partida>
  /** RF-05: si es el segundo reporte y coincide, la partida queda FINALIZADA; si no, CONGELADA. */
  reportarResultado(actorId: string, partidaId: string, reporte: ReporteDeMarcador): Promise<Partida>
  /** RF-04 */
  agregarEvidencia(actorId: string, partidaId: string, archivo: ArchivoEvidencia): Promise<Partida>
}

export interface Dictamen {
  equipoGanadorId: string
  justificacion: string
}

/** La disputa no tiene id propio en el modelo: es una por partida y se identifica por ella. */
export interface RepositorioDisputas {
  listar(filtro: { estado?: EstadoDisputa }): Promise<DisputaResumen[]>
  /** RF-06 */
  abrir(actorId: string, partidaId: string, motivo: string): Promise<Partida>
  /** El árbitro toma el ticket (Disputa.asignarArbitro). */
  tomar(actorId: string, partidaId: string): Promise<Partida>
  /** RF-07: deja la partida AUDITADA. */
  emitirDictamen(actorId: string, partidaId: string, dictamen: Dictamen): Promise<Partida>
}

export interface DatosIntegrante {
  nombre: string
  correo: string
}

export interface RepositorioEquipos {
  obtener(equipoId: string): Promise<Equipo>
  agregarIntegrante(actorId: string, equipoId: string, datos: DatosIntegrante): Promise<Equipo>
}

/** Lo que la raíz de composición le entrega a la interfaz. */
export interface Repositorios {
  usuarios: RepositorioUsuarios
  torneos: RepositorioTorneos
  partidas: RepositorioPartidas
  disputas: RepositorioDisputas
  equipos: RepositorioEquipos
}
