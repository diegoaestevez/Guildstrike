import { ErrorDeRegla } from '../../aplicacion/errores'
import { MENSAJES_FUERA_DEL_MODELO } from '../../dominio/mensajes'
import type { Rol } from '../../dominio/tipos'
import type { RegistroPartida, RegistroUsuario } from './almacen'

// Lo que hará la capa de rutas de la API antes de llamar al modelo: revisar que quien actúa
// tenga el rol para hacerlo. El modelo no conoce roles en estas operaciones; por eso no son
// sus mensajes, sino el 403 del contrato.

const sinPermiso = () => new ErrorDeRegla(MENSAJES_FUERA_DEL_MODELO.sinPermiso, 403)

export function exigirRol(usuario: RegistroUsuario, ...roles: Rol[]): void {
  if (!roles.includes(usuario.rol)) {
    throw sinPermiso()
  }
}

/** Capitán de ese equipo en particular. */
export function exigirCapitanDe(usuario: RegistroUsuario, equipoId: string): void {
  if (usuario.rol !== 'CAPITAN' || usuario.equipoId !== equipoId) {
    throw sinPermiso()
  }
}

/** Capitán de uno de los dos equipos de la partida. */
export function exigirCapitanParticipante(usuario: RegistroUsuario, partida: RegistroPartida): void {
  if (usuario.rol !== 'CAPITAN' || !usuario.equipoId || !partida.equipoIds.includes(usuario.equipoId)) {
    throw sinPermiso()
  }
}
