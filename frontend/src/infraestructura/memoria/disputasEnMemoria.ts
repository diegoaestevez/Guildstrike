import type { RepositorioDisputas } from '../../aplicacion/puertos'
import type { DisputaResumen } from '../../dominio/tipos'
import type { ContextoSimulado } from './almacen'
import { exigirRol } from './autorizacion'
import { aDisputaResumen, aPartida } from './proyecciones'
import { abrirDisputa, asignarArbitro, resolverDisputa } from './reglasDelModelo'

export function crearDisputasEnMemoria({ almacen, reloj, esperar }: ContextoSimulado): RepositorioDisputas {
  return {
    async listar({ estado }) {
      await esperar()
      return almacen
        .listarPartidas()
        .map((partida) => aDisputaResumen(almacen, partida))
        .filter((disputa): disputa is DisputaResumen => disputa !== null && (!estado || disputa.estado === estado))
        .sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime())
    },

    async abrir(actorId, partidaId, motivo) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      exigirRol(actor, 'CAPITAN')
      abrirDisputa(partida, actor, motivo, reloj())
      return aPartida(almacen, partida)
    },

    async tomar(actorId, partidaId) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      exigirRol(actor, 'ARBITRO')
      asignarArbitro(partida, actor)
      return aPartida(almacen, partida)
    },

    async emitirDictamen(actorId, partidaId, { equipoGanadorId, justificacion }) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      exigirRol(actor, 'ARBITRO')
      resolverDisputa(partida, actor, equipoGanadorId, justificacion, reloj())
      return aPartida(almacen, partida)
    },
  }
}
