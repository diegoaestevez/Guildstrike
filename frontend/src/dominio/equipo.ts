// Equipo.js: el roster (sin contar al capitán) va de 4 a 9 integrantes.
export const ROSTER_MINIMO = 4
export const ROSTER_MAXIMO = 9

export interface EstadoRoster {
  total: number
  /** Equipo.esValido: puede inscribirse en un torneo. */
  valido: boolean
  /** Equipo.agregarIntegrante rechaza al décimo. */
  lleno: boolean
  faltanParaMinimo: number
}

export function estadoRoster(totalIntegrantes: number): EstadoRoster {
  return {
    total: totalIntegrantes,
    valido: totalIntegrantes >= ROSTER_MINIMO && totalIntegrantes <= ROSTER_MAXIMO,
    lleno: totalIntegrantes >= ROSTER_MAXIMO,
    faltanParaMinimo: Math.max(0, ROSTER_MINIMO - totalIntegrantes),
  }
}
