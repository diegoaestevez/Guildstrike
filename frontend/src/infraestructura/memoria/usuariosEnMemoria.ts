import type { RepositorioUsuarios } from '../../aplicacion/puertos'
import type { ContextoSimulado } from './almacen'
import { aUsuario } from './proyecciones'

export function crearUsuariosEnMemoria({ almacen, esperar }: ContextoSimulado): RepositorioUsuarios {
  return {
    async listar() {
      await esperar()
      return almacen.listarUsuarios().map((usuario) => aUsuario(almacen, usuario))
    },
  }
}
