import { ErrorDeRegla } from '../../aplicacion/errores'
import type { RepositorioTorneos } from '../../aplicacion/puertos'
import { equiposQueAvanzan, motivoParaNoGenerarRonda } from '../../dominio/torneo'
import type { ContextoSimulado } from './almacen'
import { exigirCapitanDe, exigirRol } from './autorizacion'
import { aRonda, aTorneo, aTorneoResumen } from './proyecciones'
import { agregarRonda, cerrarInscripciones, inscribirEquipo } from './reglasDelModelo'

export function crearTorneosEnMemoria({ almacen, reloj, esperar }: ContextoSimulado): RepositorioTorneos {
  return {
    async listar() {
      await esperar()
      return almacen.listarTorneos().map(aTorneoResumen)
    },

    async obtener(torneoId) {
      await esperar()
      return aTorneo(almacen, almacen.torneo(torneoId))
    },

    async inscribirEquipo(actorId, torneoId, equipoId) {
      await esperar()
      const torneo = almacen.torneo(torneoId)
      exigirCapitanDe(almacen.usuario(actorId), equipoId)
      inscribirEquipo(torneo, almacen.equipo(equipoId))
      return aTorneo(almacen, torneo)
    },

    async cerrarInscripciones(actorId, torneoId) {
      await esperar()
      const torneo = almacen.torneo(torneoId)
      exigirRol(almacen.usuario(actorId), 'ADMINISTRADOR')
      cerrarInscripciones(almacen, torneo, reloj())
      return aTorneo(almacen, torneo)
    },

    // Excepción a propósito frente al backend: avanzan los ganadores y el pase automático,
    // no todos los inscritos (ver CONTRATO-API.md, "Notas para el backend").
    async generarSiguienteRonda(actorId, torneoId) {
      await esperar()
      const torneo = almacen.torneo(torneoId)
      exigirRol(almacen.usuario(actorId), 'ADMINISTRADOR')
      const vista = aTorneo(almacen, torneo)
      const motivo = motivoParaNoGenerarRonda(vista)
      if (motivo) {
        throw new ErrorDeRegla(motivo)
      }
      const ultima = torneo.rondas.at(-1)
      const avanzan = ultima ? equiposQueAvanzan(aRonda(almacen, ultima)) : []
      agregarRonda(almacen, torneo, avanzan.map((equipo) => equipo.id), reloj())
      return aTorneo(almacen, torneo)
    },
  }
}
