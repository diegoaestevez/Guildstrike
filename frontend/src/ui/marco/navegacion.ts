import { Gavel, Trophy, UsersRound, type LucideIcon } from 'lucide-react'
import type { Rol } from '../../dominio/tipos'

export interface EntradaNavegacion {
  a: string
  etiqueta: string
  icono: LucideIcon
  /** Quién la ve en el menú. */
  roles: readonly Rol[]
  /** Rutas que cuentan como esta sección (una partida es parte de Torneos). */
  prefijos: readonly string[]
}

export const NAVEGACION: readonly EntradaNavegacion[] = [
  { a: '/torneos', etiqueta: 'Torneos', icono: Trophy, roles: ['ADMINISTRADOR', 'CAPITAN', 'ARBITRO'], prefijos: ['/torneos', '/partidas'] },
  { a: '/mi-equipo', etiqueta: 'Mi equipo', icono: UsersRound, roles: ['CAPITAN'], prefijos: ['/mi-equipo'] },
  { a: '/arbitraje', etiqueta: 'Arbitraje', icono: Gavel, roles: ['ARBITRO'], prefijos: ['/arbitraje'] },
]

export const navegacionPara = (rol: Rol) => NAVEGACION.filter((entrada) => entrada.roles.includes(rol))
