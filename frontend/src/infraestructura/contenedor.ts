import type { Repositorios } from '../aplicacion/puertos'
import { crearClienteHttp } from './http/clienteHttp'
import { crearRepositoriosHttp } from './http/repositoriosHttp'
import { crearRepositoriosEnMemoria } from './memoria'

// Raíz de composición: el único archivo que conoce las implementaciones concretas.
// Decide qué adaptador recibe la interfaz según VITE_FUENTE_DATOS (ver .env.example).

export type FuenteDeDatos = 'memoria' | 'api'

export function leerFuente(valor: string | undefined): FuenteDeDatos {
  if (valor === undefined || valor === '' || valor === 'memoria') {
    return 'memoria'
  }
  if (valor === 'api') {
    return 'api'
  }
  throw new Error(`VITE_FUENTE_DATOS debe ser "memoria" o "api", y vale "${valor}"`)
}

export function crearRepositorios(fuente: FuenteDeDatos = leerFuente(import.meta.env.VITE_FUENTE_DATOS)): Repositorios {
  return fuente === 'api' ? crearRepositoriosHttp(crearClienteHttp()) : crearRepositoriosEnMemoria()
}
