import {
  CalendarClock,
  CircleCheck,
  CirclePlay,
  Flag,
  Gavel,
  ImageUp,
  ListChecks,
  ShieldCheck,
  Snowflake,
  Swords,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { EstadoDisputa, EstadoPartida, EstadoTorneo, FormatoTorneo, Rol, TipoEvento } from '../dominio/tipos'

// Cómo se nombra y se pinta cada valor del dominio. El dominio no sabe de colores ni de
// íconos; la interfaz los decide aquí, en un solo lugar.

export type Tono = 'programada' | 'en-curso' | 'finalizada' | 'congelada' | 'auditada' | 'abierto' | 'oro' | 'neutro'

export interface Presentacion {
  etiqueta: string
  tono: Tono
  icono: LucideIcon
}

export const ESTADO_PARTIDA: Record<EstadoPartida, Presentacion & { explicacion: string }> = {
  PROGRAMADA: { etiqueta: 'Programada', tono: 'programada', icono: CalendarClock, explicacion: 'Todavía no empieza.' },
  EN_CURSO: { etiqueta: 'En curso', tono: 'en-curso', icono: CirclePlay, explicacion: 'Se está jugando.' },
  FINALIZADA: {
    etiqueta: 'Finalizada',
    tono: 'finalizada',
    icono: CircleCheck,
    explicacion: 'Los dos capitanes coincidieron en el marcador y el sistema lo validó.',
  },
  CONGELADA: {
    etiqueta: 'Congelada',
    tono: 'congelada',
    icono: Snowflake,
    explicacion: 'Tiene una disputa abierta: no acepta reportes, evidencias ni cambios hasta el dictamen.',
  },
  AUDITADA: {
    etiqueta: 'Auditada',
    tono: 'auditada',
    icono: ShieldCheck,
    explicacion: 'Un árbitro revisó la disputa y su dictamen decidió al ganador.',
  },
}

export const ESTADO_TORNEO: Record<EstadoTorneo, Presentacion> = {
  ACTIVO: { etiqueta: 'Inscripciones abiertas', tono: 'oro', icono: UserPlus },
  EN_CURSO: { etiqueta: 'En curso', tono: 'en-curso', icono: Swords },
}

export const ESTADO_DISPUTA: Record<EstadoDisputa, Presentacion> = {
  ABIERTO: { etiqueta: 'Abierta', tono: 'abierto', icono: Flag },
  RESUELTO: { etiqueta: 'Resuelta', tono: 'auditada', icono: Gavel },
}

export const EVENTO: Record<TipoEvento, Presentacion> = {
  PARTIDA_INICIADA: { etiqueta: 'Partida iniciada', tono: 'en-curso', icono: CirclePlay },
  EVIDENCIA_AGREGADA: { etiqueta: 'Evidencia agregada', tono: 'neutro', icono: ImageUp },
  RESULTADO_REPORTADO: { etiqueta: 'Marcador reportado', tono: 'neutro', icono: ListChecks },
  RESULTADO_VALIDADO: { etiqueta: 'Resultado validado', tono: 'finalizada', icono: CircleCheck },
  DISPUTA_ABIERTA: { etiqueta: 'Disputa abierta', tono: 'abierto', icono: Flag },
  DICTAMEN_EMITIDO: { etiqueta: 'Dictamen emitido', tono: 'auditada', icono: Gavel },
}

export const ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administración',
  CAPITAN: 'Capitán',
  ARBITRO: 'Árbitro',
  INTEGRANTE: 'Integrante',
}

/** El rol dentro de una frase: "entraste como árbitro", "es para capitanes". */
export const ROL_EN_FRASE: Record<Rol, { singular: string; plural: string }> = {
  ADMINISTRADOR: { singular: 'administrador', plural: 'administradores' },
  CAPITAN: { singular: 'capitán', plural: 'capitanes' },
  ARBITRO: { singular: 'árbitro', plural: 'árbitros' },
  INTEGRANTE: { singular: 'integrante', plural: 'integrantes' },
}

export const FORMATO: Record<FormatoTorneo, string> = {
  ELIMINACION_SIMPLE: 'Eliminación simple',
}

/** Clases por tono: texto, borde y fondo tenue. Escritas completas para que Tailwind las vea. */
export const CLASES_TONO: Record<Tono, string> = {
  programada: 'text-programada border-programada/40 bg-programada/10',
  'en-curso': 'text-en-curso border-en-curso/40 bg-en-curso/10',
  finalizada: 'text-finalizada border-finalizada/40 bg-finalizada/10',
  congelada: 'text-congelada border-congelada/40 bg-congelada/10',
  auditada: 'text-auditada border-auditada/40 bg-auditada/10',
  abierto: 'text-abierto border-abierto/40 bg-abierto/10',
  oro: 'text-oro border-oro/40 bg-oro/10',
  neutro: 'text-texto-2 border-borde bg-elevada',
}

/** Solo el color del texto o del ícono, para puntos y líneas. */
export const TEXTO_TONO: Record<Tono, string> = {
  programada: 'text-programada',
  'en-curso': 'text-en-curso',
  finalizada: 'text-finalizada',
  congelada: 'text-congelada',
  auditada: 'text-auditada',
  abierto: 'text-abierto',
  oro: 'text-oro',
  neutro: 'text-texto-2',
}
