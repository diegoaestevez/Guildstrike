import type { RepositorioPartidas } from '../../aplicacion/puertos'
import type { ContextoSimulado } from './almacen'
import { exigirCapitanParticipante, exigirRol } from './autorizacion'
import { aPartida } from './proyecciones'
import { agregarEvidencia, finalizarJuego, iniciar, registrarResultado } from './reglasDelModelo'

/** Dirección local para ver la imagen recién subida; en Node (pruebas) puede no existir. */
function urlLocal(contenido: Blob): string | null {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(contenido) : null
}

export function crearPartidasEnMemoria({ almacen, reloj, esperar }: ContextoSimulado): RepositorioPartidas {
  return {
    async obtener(partidaId) {
      await esperar()
      return aPartida(almacen, almacen.partida(partidaId))
    },

    async iniciar(actorId, partidaId) {
      await esperar()
      const partida = almacen.partida(partidaId)
      exigirRol(almacen.usuario(actorId), 'ADMINISTRADOR')
      iniciar(partida, reloj())
      return aPartida(almacen, partida)
    },

    async terminar(actorId, partidaId) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      if (actor.rol !== 'ADMINISTRADOR') {
        exigirCapitanParticipante(actor, partida)
      }
      finalizarJuego(partida, reloj())
      return aPartida(almacen, partida)
    },

    async reportarResultado(actorId, partidaId, { marcadorPropio, marcadorRival }) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      exigirRol(actor, 'CAPITAN')
      registrarResultado(almacen, partida, actor, marcadorPropio, marcadorRival, reloj())
      return aPartida(almacen, partida)
    },

    async agregarEvidencia(actorId, partidaId, archivo) {
      await esperar()
      const partida = almacen.partida(partidaId)
      const actor = almacen.usuario(actorId)
      exigirCapitanParticipante(actor, partida)
      agregarEvidencia(
        partida,
        actor,
        { nombre: archivo.nombre, tipo: archivo.tipo, tamanoBytes: archivo.tamanoBytes, url: urlLocal(archivo.contenido) },
        reloj(),
      )
      return aPartida(almacen, partida)
    },
  }
}
