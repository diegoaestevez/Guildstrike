import { MENSAJES_DEL_MODELO } from './mensajes'

// Mismos valores que backend/config/limitesEvidencia.js (R-05).
export const LIMITE_EVIDENCIA_MINUTOS = 5
export const TAMANO_MAXIMO_EVIDENCIA_BYTES = 5 * 1024 * 1024 // 5 MB
export const FORMATOS_EVIDENCIA: readonly string[] = Object.freeze(['image/png', 'image/jpeg'])

const LIMITE_EVIDENCIA_MS = LIMITE_EVIDENCIA_MINUTOS * 60_000

export type VentanaEvidencia =
  | { estado: 'SIN_FIN' }
  | { estado: 'ABIERTA'; restanteMs: number; cierra: Date }
  | { estado: 'CERRADA'; cerro: Date }

/**
 * La ventana para subir evidencia abre en `fechaFin` y dura LIMITE_EVIDENCIA_MINUTOS,
 * con la misma condición que Evidencia.validar: 0 <= minutos <= límite.
 */
export function ventanaDeEvidencia(fechaFin: Date | null, ahora: Date): VentanaEvidencia {
  if (!fechaFin) {
    return { estado: 'SIN_FIN' }
  }
  const transcurridoMs = ahora.getTime() - fechaFin.getTime()
  const cierra = new Date(fechaFin.getTime() + LIMITE_EVIDENCIA_MS)
  if (transcurridoMs < 0 || transcurridoMs > LIMITE_EVIDENCIA_MS) {
    return { estado: 'CERRADA', cerro: cierra }
  }
  return { estado: 'ABIERTA', restanteMs: LIMITE_EVIDENCIA_MS - transcurridoMs, cierra }
}

/**
 * Formato y tamaño, en el mismo orden que Evidencia.validar. Devuelve el mensaje del modelo
 * o null si el archivo pasa. El tiempo se revisa aparte con ventanaDeEvidencia.
 */
export function validarArchivoEvidencia(archivo: { tipo: string; tamanoBytes: number }): string | null {
  if (!FORMATOS_EVIDENCIA.includes(archivo.tipo)) {
    return MENSAJES_DEL_MODELO.evidenciaFormato
  }
  if (archivo.tamanoBytes > TAMANO_MAXIMO_EVIDENCIA_BYTES) {
    return MENSAJES_DEL_MODELO.evidenciaTamano
  }
  return null
}

/** Minutos entre el fin de la partida y la carga, como los calcula Evidencia.validar. */
export function minutosDesdeElFin(fechaFin: Date, fechaCarga: Date): number {
  return (fechaCarga.getTime() - fechaFin.getTime()) / 60_000
}
