import { useQuery } from '@tanstack/react-query'
import type { EstadoDisputa } from '../../dominio/tipos'
import { useRepositorios } from '../proveedores/contextos'
import { claves } from './claves'

// Lecturas: cada una pide al puerto que le toca y nada más.

export function useUsuarios() {
  const { usuarios } = useRepositorios()
  return useQuery({ queryKey: claves.usuarios, queryFn: () => usuarios.listar() })
}

export function useTorneos() {
  const { torneos } = useRepositorios()
  return useQuery({ queryKey: claves.torneos, queryFn: () => torneos.listar() })
}

export function useTorneo(torneoId: string) {
  const { torneos } = useRepositorios()
  return useQuery({ queryKey: claves.torneo(torneoId), queryFn: () => torneos.obtener(torneoId) })
}

export function usePartida(partidaId: string) {
  const { partidas } = useRepositorios()
  return useQuery({ queryKey: claves.partida(partidaId), queryFn: () => partidas.obtener(partidaId) })
}

export function useDisputas(estado: EstadoDisputa) {
  const { disputas } = useRepositorios()
  return useQuery({ queryKey: claves.disputasPorEstado(estado), queryFn: () => disputas.listar({ estado }) })
}

export function useEquipo(equipoId: string | null) {
  const { equipos } = useRepositorios()
  return useQuery({
    queryKey: claves.equipo(equipoId ?? ''),
    queryFn: () => equipos.obtener(equipoId ?? ''),
    enabled: equipoId !== null,
  })
}
