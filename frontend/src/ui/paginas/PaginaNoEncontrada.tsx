import { ArrowLeft, Compass, OctagonExclamationPoint } from 'lucide-react'
import { useRouteError } from 'react-router'
import { EnlaceBoton } from '../componentes/Boton'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { mensajeDeError } from '../errores'

export function PaginaNoEncontrada() {
  return (
    <EstadoVacio
      icono={Compass}
      titulo="Esta página no existe"
      accion={
        <EnlaceBoton to="/torneos" icono={ArrowLeft}>
          Volver a torneos
        </EnlaceBoton>
      }
    >
      Revisa la dirección o vuelve a la lista de torneos.
    </EstadoVacio>
  )
}

/** Un error que nadie atrapó al pintar una ruta: se muestra en vez de dejar la pantalla en blanco. */
export function ErrorDeRuta() {
  const error = useRouteError()
  return (
    <main className="mx-auto max-w-xl p-6">
      <EstadoVacio
        icono={OctagonExclamationPoint}
        titulo="Algo salió mal al mostrar esta pantalla"
        accion={
          <EnlaceBoton to="/torneos" icono={ArrowLeft}>
            Volver a torneos
          </EnlaceBoton>
        }
      >
        {mensajeDeError(error)}
      </EstadoVacio>
    </main>
  )
}
