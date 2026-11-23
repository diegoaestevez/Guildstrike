import { RotateCw, SearchX, WifiOff } from 'lucide-react'
import { esNoEncontrado, mensajeDeError } from '../errores'
import { Boton } from './Boton'
import { EstadoVacio } from './EstadoVacio'

interface Props {
  error: unknown
  titulo?: string
  reintentar?: () => void
}

/** Una lectura que falló: si no existe lo dice así; si fue la red, ofrece reintentar. */
export function ErrorDeCarga({ error, titulo = 'No se pudo cargar', reintentar }: Props) {
  const noExiste = esNoEncontrado(error)
  return (
    <div role="alert">
      <EstadoVacio
        icono={noExiste ? SearchX : WifiOff}
        titulo={noExiste ? 'No lo encontramos' : titulo}
        accion={
          !noExiste && reintentar ? (
            <Boton icono={RotateCw} onClick={reintentar}>
              Reintentar
            </Boton>
          ) : undefined
        }
      >
        {mensajeDeError(error)}
      </EstadoVacio>
    </div>
  )
}
