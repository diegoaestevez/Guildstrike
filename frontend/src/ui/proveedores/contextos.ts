import { createContext, useContext } from 'react'
import type { Repositorios } from '../../aplicacion/puertos'
import type { Usuario } from '../../dominio/tipos'

// Los contextos y sus ganchos viven aparte de los componentes que los proveen, para que
// cada archivo de componente exporte solo componentes (recarga en caliente de Vite).

/** Inyección de dependencias: las pantallas piden los puertos y nunca saben qué hay detrás. */
export const ContextoRepositorios = createContext<Repositorios | null>(null)

export function useRepositorios(): Repositorios {
  const repositorios = useContext(ContextoRepositorios)
  if (!repositorios) {
    throw new Error('useRepositorios necesita un ProveedorRepositorios más arriba')
  }
  return repositorios
}

export interface Sesion {
  usuario: Usuario
  /** Las cuentas que se pueden elegir: todas menos los integrantes, que no tienen acciones. */
  cuentas: Usuario[]
  entrarComo: (usuarioId: string) => void
}

export const ContextoSesion = createContext<Sesion | null>(null)

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion)
  if (!sesion) {
    throw new Error('useSesion necesita un ProveedorSesion más arriba')
  }
  return sesion
}
