import type { RepositorioEquipos } from '../../aplicacion/puertos'
import type { ContextoSimulado } from './almacen'
import { exigirCapitanDe } from './autorizacion'
import { aEquipo } from './proyecciones'
import { agregarIntegrante } from './reglasDelModelo'

export function crearEquiposEnMemoria({ almacen, esperar }: ContextoSimulado): RepositorioEquipos {
  let consecutivo = 0
  const nuevoId = () => {
    consecutivo += 1
    return `int-nuevo-${consecutivo}`
  }

  return {
    async obtener(equipoId) {
      await esperar()
      return aEquipo(almacen, equipoId)
    },

    async agregarIntegrante(actorId, equipoId, datos) {
      await esperar()
      const equipo = almacen.equipo(equipoId)
      exigirCapitanDe(almacen.usuario(actorId), equipoId)
      agregarIntegrante(almacen, equipo, datos, nuevoId)
      return aEquipo(almacen, equipoId)
    },
  }
}
