import { RouterProvider } from 'react-router/dom'
import type { Repositorios } from '../aplicacion/puertos'
import { ProveedorConsultas } from './proveedores/ProveedorConsultas'
import { ProveedorRepositorios } from './proveedores/ProveedorRepositorios'
import { ProveedorSesion } from './proveedores/ProveedorSesion'
import { enrutador } from './rutas'

/** La interfaz completa. Recibe los repositorios desde afuera: no sabe cuáles son. */
export function Aplicacion({ repositorios }: { repositorios: Repositorios }) {
  return (
    <ProveedorRepositorios repositorios={repositorios}>
      <ProveedorConsultas>
        <ProveedorSesion>
          <RouterProvider router={enrutador} />
        </ProveedorSesion>
      </ProveedorConsultas>
    </ProveedorRepositorios>
  )
}
