import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ArchivoEvidencia, DatosIntegrante, Dictamen, ReporteDeMarcador } from '../../aplicacion/puertos'
import type { Equipo, Partida, Torneo } from '../../dominio/tipos'
import { useRepositorios } from '../proveedores/contextos'
import { useSesion } from '../proveedores/contextos'
import { claves } from './claves'

// Escrituras. Cada una manda como actor a quien tiene la sesión, guarda en la caché el
// agregado que devuelve el puerto e invalida lo que ese cambio vuelve viejo.

function useAccionDeTorneo<V>(ejecutar: (actorId: string, variables: V) => Promise<Torneo>) {
  const cliente = useQueryClient()
  const { usuario } = useSesion()
  return useMutation({
    mutationFn: (variables: V) => ejecutar(usuario.id, variables),
    onSuccess: (torneo) => {
      cliente.setQueryData(claves.torneo(torneo.id), torneo)
      void cliente.invalidateQueries({ queryKey: claves.torneos, exact: true })
    },
  })
}

function useAccionDePartida<V>(ejecutar: (actorId: string, variables: V) => Promise<Partida>) {
  const cliente = useQueryClient()
  const { usuario } = useSesion()
  return useMutation({
    mutationFn: (variables: V) => ejecutar(usuario.id, variables),
    onSuccess: (partida) => {
      cliente.setQueryData(claves.partida(partida.id), partida)
      // El estado de la partida se ve en las llaves y en la bandeja del árbitro.
      void cliente.invalidateQueries({ queryKey: claves.torneos })
      void cliente.invalidateQueries({ queryKey: claves.disputas })
    },
  })
}

function useAccionDeEquipo<V>(ejecutar: (actorId: string, variables: V) => Promise<Equipo>) {
  const cliente = useQueryClient()
  const { usuario } = useSesion()
  return useMutation({
    mutationFn: (variables: V) => ejecutar(usuario.id, variables),
    onSuccess: (equipo) => {
      cliente.setQueryData(claves.equipo(equipo.id), equipo)
      void cliente.invalidateQueries({ queryKey: claves.usuarios })
      void cliente.invalidateQueries({ queryKey: claves.torneos })
    },
  })
}

export function useInscribirEquipo(torneoId: string) {
  const { torneos } = useRepositorios()
  return useAccionDeTorneo((actorId, equipoId: string) => torneos.inscribirEquipo(actorId, torneoId, equipoId))
}

export function useCerrarInscripciones(torneoId: string) {
  const { torneos } = useRepositorios()
  return useAccionDeTorneo<void>((actorId) => torneos.cerrarInscripciones(actorId, torneoId))
}

export function useGenerarSiguienteRonda(torneoId: string) {
  const { torneos } = useRepositorios()
  return useAccionDeTorneo<void>((actorId) => torneos.generarSiguienteRonda(actorId, torneoId))
}

export function useIniciarPartida(partidaId: string) {
  const { partidas } = useRepositorios()
  return useAccionDePartida<void>((actorId) => partidas.iniciar(actorId, partidaId))
}

export function useTerminarPartida(partidaId: string) {
  const { partidas } = useRepositorios()
  return useAccionDePartida<void>((actorId) => partidas.terminar(actorId, partidaId))
}

export function useReportarResultado(partidaId: string) {
  const { partidas } = useRepositorios()
  return useAccionDePartida((actorId, reporte: ReporteDeMarcador) => partidas.reportarResultado(actorId, partidaId, reporte))
}

export function useAgregarEvidencia(partidaId: string) {
  const { partidas } = useRepositorios()
  return useAccionDePartida((actorId, archivo: ArchivoEvidencia) => partidas.agregarEvidencia(actorId, partidaId, archivo))
}

export function useAbrirDisputa(partidaId: string) {
  const { disputas } = useRepositorios()
  return useAccionDePartida((actorId, motivo: string) => disputas.abrir(actorId, partidaId, motivo))
}

export function useTomarDisputa(partidaId: string) {
  const { disputas } = useRepositorios()
  return useAccionDePartida<void>((actorId) => disputas.tomar(actorId, partidaId))
}

export function useEmitirDictamen(partidaId: string) {
  const { disputas } = useRepositorios()
  return useAccionDePartida((actorId, dictamen: Dictamen) => disputas.emitirDictamen(actorId, partidaId, dictamen))
}

export function useAgregarIntegrante(equipoId: string) {
  const { equipos } = useRepositorios()
  return useAccionDeEquipo((actorId, datos: DatosIntegrante) => equipos.agregarIntegrante(actorId, equipoId, datos))
}
