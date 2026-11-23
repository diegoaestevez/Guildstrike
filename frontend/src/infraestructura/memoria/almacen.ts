import { ErrorDeRegla } from '../../aplicacion/errores'
import { MENSAJES_FUERA_DEL_MODELO } from '../../dominio/mensajes'
import type {
  EstadoDisputa,
  EstadoPartida,
  EstadoTorneo,
  FormatoTorneo,
  Rol,
  TipoEvento,
} from '../../dominio/tipos'

// Registros: cómo guarda el backend simulado cada cosa. Se relacionan por id, igual que
// lo harían documentos en la base; las proyecciones los convierten en objetos del dominio.

export interface RegistroUsuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  equipoId: string | null
}

export interface RegistroEquipo {
  id: string
  nombre: string
  capitanId: string
  integranteIds: string[]
}

export interface RegistroRonda {
  numero: number
  partidaIds: string[]
  paseAutomaticoId: string | null
}

export interface RegistroTorneo {
  id: string
  nombre: string
  estado: EstadoTorneo
  formato: FormatoTorneo
  equipoIds: string[]
  rondas: RegistroRonda[]
}

export interface RegistroReporte {
  equipoId: string
  capitanId: string
  marcadorPropio: number
  marcadorRival: number
  fecha: Date
}

export interface RegistroEvidencia {
  equipoId: string
  capitanId: string
  nombre: string
  tipo: string
  tamanoBytes: number
  fechaCarga: Date
  url: string | null
}

export interface RegistroDisputa {
  solicitanteId: string
  motivo: string
  estado: EstadoDisputa
  arbitroId: string | null
  equipoGanadorId: string | null
  justificacion: string | null
  fechaCreacion: Date
  fechaResolucion: Date | null
}

export interface RegistroEvento {
  tipo: TipoEvento
  usuarioId: string | null
  descripcion: string
  fecha: Date
}

export interface RegistroPartida {
  id: string
  torneoId: string
  ronda: number
  equipoIds: [string, string]
  estado: EstadoPartida
  fechaProgramada: Date
  fechaFin: Date | null
  reportes: RegistroReporte[]
  evidencias: RegistroEvidencia[]
  disputa: RegistroDisputa | null
  ganadorId: string | null
  eventos: RegistroEvento[]
}

export interface DatosEnMemoria {
  usuarios: RegistroUsuario[]
  equipos: RegistroEquipo[]
  torneos: RegistroTorneo[]
  partidas: RegistroPartida[]
}

const noExiste = (recurso: string) => new ErrorDeRegla(MENSAJES_FUERA_DEL_MODELO.noExiste(recurso), 404)

/** El estado del backend simulado. Vive mientras la pestaña esté abierta. */
export class AlmacenEnMemoria {
  private readonly usuarios = new Map<string, RegistroUsuario>()
  private readonly equipos = new Map<string, RegistroEquipo>()
  private readonly torneos = new Map<string, RegistroTorneo>()
  private readonly partidas = new Map<string, RegistroPartida>()

  constructor(datos: DatosEnMemoria) {
    // Copia profunda: la semilla nunca se modifica, así cada almacén arranca igual.
    const copia = structuredClone(datos)
    copia.usuarios.forEach((usuario) => this.usuarios.set(usuario.id, usuario))
    copia.equipos.forEach((equipo) => this.equipos.set(equipo.id, equipo))
    copia.torneos.forEach((torneo) => this.torneos.set(torneo.id, torneo))
    copia.partidas.forEach((partida) => this.partidas.set(partida.id, partida))
  }

  usuario(id: string): RegistroUsuario {
    return this.usuarios.get(id) ?? throwError(noExiste('El usuario'))
  }

  equipo(id: string): RegistroEquipo {
    return this.equipos.get(id) ?? throwError(noExiste('El equipo'))
  }

  torneo(id: string): RegistroTorneo {
    return this.torneos.get(id) ?? throwError(noExiste('El torneo'))
  }

  partida(id: string): RegistroPartida {
    return this.partidas.get(id) ?? throwError(noExiste('La partida'))
  }

  listarUsuarios(): RegistroUsuario[] {
    return [...this.usuarios.values()]
  }

  listarTorneos(): RegistroTorneo[] {
    return [...this.torneos.values()]
  }

  listarPartidas(): RegistroPartida[] {
    return [...this.partidas.values()]
  }

  buscarUsuarioPorCorreo(correo: string): RegistroUsuario | null {
    const buscado = correo.trim().toLowerCase()
    return this.listarUsuarios().find((usuario) => usuario.correo.toLowerCase() === buscado) ?? null
  }

  guardarUsuario(usuario: RegistroUsuario): void {
    this.usuarios.set(usuario.id, usuario)
  }

  guardarPartida(partida: RegistroPartida): void {
    this.partidas.set(partida.id, partida)
  }
}

function throwError(error: Error): never {
  throw error
}

/** Lo que comparten los cinco repositorios en memoria. */
export interface ContextoSimulado {
  almacen: AlmacenEnMemoria
  /** Reloj inyectable: las pruebas fijan la hora para probar la ventana de evidencia. */
  reloj: () => Date
  /** Latencia artificial, para que se vean los estados de carga. */
  esperar: () => Promise<void>
}
