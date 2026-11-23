import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Rol } from '../../dominio/tipos'
import { ROL_EN_FRASE } from '../presentacion'
import { useSesion } from '../proveedores/contextos'
import { EstadoVacio } from './EstadoVacio'

/** Muestra la sección solo a esos roles; a los demás les dice para quién es. Es interfaz, no seguridad. */
export function SoloPara({ roles, children }: { roles: readonly Rol[]; children: ReactNode }) {
  const { usuario } = useSesion()
  if (roles.includes(usuario.rol)) {
    return children
  }
  const quienes = roles.map((rol) => ROL_EN_FRASE[rol].plural).join(' o ')
  return (
    <EstadoVacio icono={Lock} titulo={`Esta sección es para ${quienes}`}>
      Entraste como {ROL_EN_FRASE[usuario.rol].singular}. Cambia de cuenta en “Entrar como”, arriba.
    </EstadoVacio>
  )
}
