import type { Repositorios } from '../../aplicacion/puertos'
import type { ClienteHttp } from './clienteHttp'
import type {
  DisputaResumenDTO,
  EquipoDTO,
  PartidaDTO,
  TorneoDTO,
  TorneoResumenDTO,
  UsuarioDTO,
} from './dto'
import { aDisputaResumen, aEquipo, aPartida, aTorneo, aTorneoResumen, aUsuario } from './mapeos'

// Cada puerto traducido a las rutas de CONTRATO-API.md. Aquí no hay reglas: las aplica el backend.

const segmento = encodeURIComponent

export function crearRepositoriosHttp(cliente: ClienteHttp): Repositorios {
  const partida = (partidaId: string) => `/api/partidas/${segmento(partidaId)}`
  const torneo = (torneoId: string) => `/api/torneos/${segmento(torneoId)}`

  return {
    usuarios: {
      listar: async () => (await cliente.get<UsuarioDTO[]>('/api/usuarios')).map(aUsuario),
    },

    torneos: {
      listar: async () => (await cliente.get<TorneoResumenDTO[]>('/api/torneos')).map(aTorneoResumen),
      obtener: async (torneoId) => aTorneo(await cliente.get<TorneoDTO>(torneo(torneoId))),
      inscribirEquipo: async (actorId, torneoId, equipoId) =>
        aTorneo(await cliente.post<TorneoDTO>(`${torneo(torneoId)}/equipos`, { actorId, cuerpo: { equipoId } })),
      cerrarInscripciones: async (actorId, torneoId) =>
        aTorneo(await cliente.post<TorneoDTO>(`${torneo(torneoId)}/cerrar-inscripciones`, { actorId })),
      generarSiguienteRonda: async (actorId, torneoId) =>
        aTorneo(await cliente.post<TorneoDTO>(`${torneo(torneoId)}/rondas`, { actorId })),
    },

    partidas: {
      obtener: async (partidaId) => aPartida(await cliente.get<PartidaDTO>(partida(partidaId))),
      iniciar: async (actorId, partidaId) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/iniciar`, { actorId })),
      terminar: async (actorId, partidaId) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/finalizar`, { actorId })),
      reportarResultado: async (actorId, partidaId, reporte) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/reportes`, { actorId, cuerpo: reporte })),
      agregarEvidencia: async (actorId, partidaId, archivo) => {
        const formulario = new FormData()
        formulario.append('archivo', archivo.contenido, archivo.nombre)
        return aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/evidencias`, { actorId, formulario }))
      },
    },

    disputas: {
      listar: async ({ estado }) => {
        const filtro = estado ? `?estado=${segmento(estado)}` : ''
        return (await cliente.get<DisputaResumenDTO[]>(`/api/disputas${filtro}`)).map(aDisputaResumen)
      },
      abrir: async (actorId, partidaId, motivo) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/disputa`, { actorId, cuerpo: { motivo } })),
      tomar: async (actorId, partidaId) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/disputa/arbitro`, { actorId })),
      emitirDictamen: async (actorId, partidaId, dictamen) =>
        aPartida(await cliente.post<PartidaDTO>(`${partida(partidaId)}/disputa/dictamen`, { actorId, cuerpo: dictamen })),
    },

    equipos: {
      obtener: async (equipoId) => aEquipo(await cliente.get<EquipoDTO>(`/api/equipos/${segmento(equipoId)}`)),
      agregarIntegrante: async (actorId, equipoId, datos) =>
        aEquipo(await cliente.post<EquipoDTO>(`/api/equipos/${segmento(equipoId)}/integrantes`, { actorId, cuerpo: datos })),
    },
  }
}
