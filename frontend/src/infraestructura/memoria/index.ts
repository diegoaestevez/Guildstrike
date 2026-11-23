import type { Repositorios } from '../../aplicacion/puertos'
import { AlmacenEnMemoria, type ContextoSimulado, type DatosEnMemoria } from './almacen'
import { crearDisputasEnMemoria } from './disputasEnMemoria'
import { crearEquiposEnMemoria } from './equiposEnMemoria'
import { crearPartidasEnMemoria } from './partidasEnMemoria'
import { crearSemilla } from './semilla'
import { crearTorneosEnMemoria } from './torneosEnMemoria'
import { crearUsuariosEnMemoria } from './usuariosEnMemoria'

export interface OpcionesMemoria {
  /** Milisegundos de espera por operación; 0 en las pruebas. */
  latenciaMs?: number
  reloj?: () => Date
  /** Datos iniciales; por defecto la semilla de demostración, fechada a partir del reloj. */
  datos?: DatosEnMemoria
}

/** Backend simulado: las mismas reglas y los mismos mensajes que backend/models, sin red. */
export function crearRepositoriosEnMemoria({ latenciaMs = 150, reloj = () => new Date(), datos }: OpcionesMemoria = {}): Repositorios {
  const contexto: ContextoSimulado = {
    almacen: new AlmacenEnMemoria(datos ?? crearSemilla(reloj())),
    reloj,
    esperar: () => (latenciaMs > 0 ? new Promise((resolver) => setTimeout(resolver, latenciaMs)) : Promise.resolve()),
  }
  return {
    usuarios: crearUsuariosEnMemoria(contexto),
    torneos: crearTorneosEnMemoria(contexto),
    partidas: crearPartidasEnMemoria(contexto),
    disputas: crearDisputasEnMemoria(contexto),
    equipos: crearEquiposEnMemoria(contexto),
  }
}
