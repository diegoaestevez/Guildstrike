import { ErrorDeConexion, ErrorDeRegla } from '../../aplicacion/errores'
import type { ErrorDTO } from './dto'

export const ENCABEZADO_USUARIO = 'X-Usuario-Id'

/**
 * El único lugar que sabe cómo viaja la identidad de quien actúa. Hoy es el encabezado
 * X-Usuario-Id porque el backend no tiene autenticación; el día que la tenga, se cambia
 * esta función (por ejemplo, por un `Authorization: Bearer`) y nada más.
 */
export function encabezadosDeIdentidad(actorId: string | undefined): Record<string, string> {
  return actorId ? { [ENCABEZADO_USUARIO]: actorId } : {}
}

export interface OpcionesEscritura {
  actorId: string
  /** Cuerpo JSON. */
  cuerpo?: unknown
  /** Cuerpo multipart (evidencias). Excluye a `cuerpo`. */
  formulario?: FormData
}

export interface ClienteHttp {
  get<T>(ruta: string): Promise<T>
  post<T>(ruta: string, opciones: OpcionesEscritura): Promise<T>
}

export interface OpcionesCliente {
  /** Vacío en el navegador: Vite (desarrollo) o Express (producción) sirven la API en el mismo origen. */
  baseUrl?: string
  fetch?: typeof fetch
}

function esErrorDTO(valor: unknown): valor is ErrorDTO {
  return typeof valor === 'object' && valor !== null && typeof (valor as ErrorDTO).error === 'string'
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    const texto = await respuesta.text()
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

export function crearClienteHttp({ baseUrl = '', fetch: fetchInyectado }: OpcionesCliente = {}): ClienteHttp {
  const hacerFetch = fetchInyectado ?? ((entrada: RequestInfo | URL, inicio?: RequestInit) => fetch(entrada, inicio))

  async function solicitar<T>(metodo: 'GET' | 'POST', ruta: string, opciones?: OpcionesEscritura): Promise<T> {
    const encabezados: Record<string, string> = { Accept: 'application/json', ...encabezadosDeIdentidad(opciones?.actorId) }
    let cuerpo: BodyInit | undefined
    if (opciones?.formulario) {
      cuerpo = opciones.formulario // el navegador pone el Content-Type con su boundary
    } else if (opciones?.cuerpo !== undefined) {
      encabezados['Content-Type'] = 'application/json'
      cuerpo = JSON.stringify(opciones.cuerpo)
    }

    let respuesta: Response
    try {
      respuesta = await hacerFetch(`${baseUrl}${ruta}`, { method: metodo, headers: encabezados, body: cuerpo })
    } catch {
      throw new ErrorDeConexion()
    }

    const datos = await leerJson(respuesta)
    if (respuesta.ok) {
      if (datos === null) {
        throw new ErrorDeConexion('La respuesta del servidor no es JSON')
      }
      // El contrato garantiza la forma; los mapeos convierten fechas y validan lo que pueden.
      return datos as T
    }
    if (respuesta.status >= 400 && respuesta.status < 500 && esErrorDTO(datos)) {
      throw new ErrorDeRegla(datos.error, respuesta.status)
    }
    throw new ErrorDeConexion(`El servidor respondió con el código ${respuesta.status}`)
  }

  return {
    get: (ruta) => solicitar('GET', ruta),
    post: (ruta, opciones) => solicitar('POST', ruta, opciones),
  }
}
