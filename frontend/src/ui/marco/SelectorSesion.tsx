import type { Rol, Usuario } from '../../dominio/tipos'
import { CLASE_CONTROL } from '../componentes/Campo'
import { ROL } from '../presentacion'
import { useSesion } from '../proveedores/contextos'

const GRUPOS: { rol: Rol; titulo: string }[] = [
  { rol: 'ADMINISTRADOR', titulo: 'Administración' },
  { rol: 'ARBITRO', titulo: 'Arbitraje' },
  { rol: 'CAPITAN', titulo: 'Capitanes' },
]

const etiqueta = (cuenta: Usuario) => `${cuenta.nombre} · ${cuenta.equipo?.nombre ?? ROL[cuenta.rol]}`

/** "Entrar como": cambia de usuario sin contraseña. Solo existe mientras no haya autenticación. */
export function SelectorSesion() {
  const { usuario, cuentas, entrarComo } = useSesion()
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor="entrar-como" className="shrink-0 text-sm text-texto-2">
        Entrar como
      </label>
      <select
        id="entrar-como"
        value={usuario.id}
        onChange={(evento) => entrarComo(evento.target.value)}
        className={`${CLASE_CONTROL} min-w-0 py-1.5 sm:w-80`}
      >
        {GRUPOS.map(({ rol, titulo }) => (
          <optgroup key={rol} label={titulo}>
            {cuentas
              .filter((cuenta) => cuenta.rol === rol)
              .sort((a, b) => etiqueta(a).localeCompare(etiqueta(b), 'es'))
              .map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {etiqueta(cuenta)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
