import type { EstadoDisputa } from '../../dominio/tipos'

// Claves de la caché de React Query. Las listas son prefijo de sus detalles, así que
// invalidar ['torneos'] también refresca cada torneo abierto.
export const claves = {
  usuarios: ['usuarios'] as const,
  torneos: ['torneos'] as const,
  torneo: (torneoId: string) => ['torneos', torneoId] as const,
  partida: (partidaId: string) => ['partidas', partidaId] as const,
  disputas: ['disputas'] as const,
  disputasPorEstado: (estado: EstadoDisputa | 'TODAS') => ['disputas', estado] as const,
  equipo: (equipoId: string) => ['equipos', equipoId] as const,
}
