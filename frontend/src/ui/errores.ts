import { ErrorDeConexion, ErrorDeRegla } from '../aplicacion/errores'

/** El texto que ve la persona: el mensaje literal de la regla, o una explicación si fue la red. */
export function mensajeDeError(error: unknown): string | null {
  if (!error) {
    return null
  }
  if (error instanceof ErrorDeRegla || error instanceof ErrorDeConexion) {
    return error.message
  }
  return error instanceof Error ? `Ocurrió un error inesperado: ${error.message}` : 'Ocurrió un error inesperado'
}

export const esNoEncontrado = (error: unknown) => error instanceof ErrorDeRegla && error.codigo === 404
