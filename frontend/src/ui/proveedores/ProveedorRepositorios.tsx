import type { ReactNode } from 'react'
import type { Repositorios } from '../../aplicacion/puertos'
import { ContextoRepositorios } from './contextos'

/** Entrega los repositorios que armó la raíz de composición a toda la interfaz. */
export function ProveedorRepositorios({ repositorios, children }: { repositorios: Repositorios; children: ReactNode }) {
  return <ContextoRepositorios.Provider value={repositorios}>{children}</ContextoRepositorios.Provider>
}
