import { describe, expect, it } from 'vitest'
import { validarArchivoEvidencia, ventanaDeEvidencia } from './evidencia'
import { accionesPermitidas, marcadorValidado, validarMarcador, type AccionPartida } from './partida'
import { campeon, equiposQueAvanzan, motivoParaNoCerrar, motivoParaNoGenerarRonda } from './torneo'
import type { EquipoInscrito, Partida, PartidaResumen, Ronda, Usuario } from './tipos'

// Los mensajes se escriben literales, copiados de backend/models: si alguien cambia
// dominio/mensajes.ts sin cambiar el backend, estas pruebas lo detectan.

const MINUTO = 60_000
const FIN = new Date('2026-11-20T19:00:00Z')
const despuesDelFin = (minutos: number) => new Date(FIN.getTime() + minutos * MINUTO)

const ALFA = { id: 'eq-alfa', nombre: 'Alfa' }
const BETA = { id: 'eq-beta', nombre: 'Beta' }

const usuario = (id: string, rol: Usuario['rol'], equipoId: string | null = null): Usuario => ({
  id,
  nombre: id,
  correo: `${id}@prueba.test`,
  rol,
  equipo: equipoId ? { id: equipoId, nombre: equipoId } : null,
})
const administrador = usuario('adm', 'ADMINISTRADOR')
const capitanAlfa = usuario('cap-alfa', 'CAPITAN', ALFA.id)
const capitanBeta = usuario('cap-beta', 'CAPITAN', BETA.id)
const capitanAjeno = usuario('cap-gama', 'CAPITAN', 'eq-gama')
const arbitro = usuario('arb', 'ARBITRO')
const otroArbitro = usuario('arb-2', 'ARBITRO')

function partida(cambios: Partial<Partida> = {}): Partida {
  return {
    id: 't-1-1',
    torneoId: 't',
    torneoNombre: 'Torneo de prueba',
    ronda: 1,
    equipos: [ALFA, BETA],
    estado: 'PROGRAMADA',
    fechaProgramada: new Date('2026-11-20T18:00:00Z'),
    fechaFin: null,
    ganadorId: null,
    marcador: null,
    reportes: [],
    evidencias: [],
    disputa: null,
    eventos: [],
    ...cambios,
  }
}

const disputaAbierta = (arbitroAsignado: Usuario | null = null): Partida['disputa'] => ({
  solicitante: { id: capitanBeta.id, nombre: capitanBeta.nombre },
  motivo: 'Marcadores discrepantes',
  estado: 'ABIERTO',
  arbitro: arbitroAsignado ? { id: arbitroAsignado.id, nombre: arbitroAsignado.nombre } : null,
  equipoGanadorId: null,
  justificacion: null,
  fechaCreacion: despuesDelFin(3),
  fechaResolucion: null,
})

function permiso(p: Partida, quien: Usuario, accion: AccionPartida, ahora = despuesDelFin(1)) {
  return accionesPermitidas(p, quien, ahora)[accion]
}

const negada = (motivo: string) => ({ permitida: false, motivo })
const permitida = { permitida: true }

describe('accionesPermitidas: PROGRAMADA', () => {
  const programada = partida()

  it('solo el administrador la inicia', () => {
    expect(permiso(programada, administrador, 'INICIAR')).toEqual(permitida)
    expect(permiso(programada, capitanAlfa, 'INICIAR')).toEqual(negada('No tienes permiso para esta acción'))
    expect(permiso(programada, arbitro, 'INICIAR')).toEqual(negada('No tienes permiso para esta acción'))
  })

  it('no se termina sin haber iniciado, ni se reporta ni se sube evidencia', () => {
    expect(permiso(programada, administrador, 'TERMINAR')).toEqual(negada('La partida no puede finalizarse en su estado actual'))
    expect(permiso(programada, capitanAlfa, 'REPORTAR_RESULTADO')).toEqual(negada('Primero hay que terminar la partida'))
    expect(permiso(programada, capitanAlfa, 'SUBIR_EVIDENCIA')).toEqual(
      negada('La evidencia sólo se recibe al finalizar la partida'),
    )
  })
})

describe('accionesPermitidas: EN_CURSO', () => {
  const enCurso = partida({ estado: 'EN_CURSO' })

  it('la terminan el administrador o un capitán de la partida, nadie más', () => {
    expect(permiso(enCurso, administrador, 'TERMINAR')).toEqual(permitida)
    expect(permiso(enCurso, capitanAlfa, 'TERMINAR')).toEqual(permitida)
    expect(permiso(enCurso, capitanAjeno, 'TERMINAR')).toEqual(negada('No tienes permiso para esta acción'))
    expect(permiso(enCurso, arbitro, 'TERMINAR')).toEqual(negada('No tienes permiso para esta acción'))
  })

  it('ya no se inicia otra vez', () => {
    expect(permiso(enCurso, administrador, 'INICIAR')).toEqual(negada('Se esperaba estado PROGRAMADA'))
  })

  it('con la partida terminada: no se termina dos veces y el capitán sube evidencia y reporta', () => {
    const terminada = partida({ estado: 'EN_CURSO', fechaFin: FIN })
    expect(permiso(terminada, administrador, 'TERMINAR')).toEqual(negada('La partida ya terminó'))
    expect(permiso(terminada, capitanAlfa, 'SUBIR_EVIDENCIA')).toEqual(permitida)
    expect(permiso(terminada, capitanAlfa, 'REPORTAR_RESULTADO')).toEqual(permitida)
    expect(permiso(terminada, capitanAlfa, 'ABRIR_DISPUTA')).toEqual(permitida)
    expect(permiso(terminada, capitanAjeno, 'SUBIR_EVIDENCIA')).toEqual(negada('No tienes permiso para esta acción'))
  })

  it('la ventana de evidencia dura 5 minutos exactos desde el fin', () => {
    const terminada = partida({ estado: 'EN_CURSO', fechaFin: FIN })
    expect(permiso(terminada, capitanAlfa, 'SUBIR_EVIDENCIA', despuesDelFin(5))).toEqual(permitida)
    expect(permiso(terminada, capitanAlfa, 'SUBIR_EVIDENCIA', despuesDelFin(5.01))).toEqual(
      negada('La evidencia está fuera del tiempo límite'),
    )
  })

  it('un equipo reporta una sola vez', () => {
    const reportada = partida({
      estado: 'EN_CURSO',
      fechaFin: FIN,
      reportes: [{ equipoId: ALFA.id, capitanId: capitanAlfa.id, marcadorPropio: 2, marcadorRival: 1, fecha: despuesDelFin(2) }],
    })
    expect(permiso(reportada, capitanAlfa, 'REPORTAR_RESULTADO')).toEqual(negada('El equipo ya reportó un resultado'))
    expect(permiso(reportada, capitanBeta, 'REPORTAR_RESULTADO')).toEqual(permitida)
  })
})

describe.each(['CONGELADA', 'AUDITADA', 'FINALIZADA'] as const)('accionesPermitidas: %s', (estado) => {
  it('no admite evidencia, reportes ni disputas (Partida._exigirNoCongelada)', () => {
    const cerrada = partida({ estado, fechaFin: FIN })
    for (const accion of ['SUBIR_EVIDENCIA', 'REPORTAR_RESULTADO', 'ABRIR_DISPUTA'] as const) {
      expect(permiso(cerrada, capitanAlfa, accion)).toEqual(negada('La partida no admite más cambios'))
    }
    expect(permiso(cerrada, administrador, 'TERMINAR')).toEqual(negada('La partida no puede finalizarse en su estado actual'))
  })
})

describe('accionesPermitidas: disputa y dictamen', () => {
  it('un árbitro toma una disputa abierta sin árbitro; un capitán no', () => {
    const congelada = partida({ estado: 'CONGELADA', fechaFin: FIN, disputa: disputaAbierta() })
    expect(permiso(congelada, arbitro, 'TOMAR_DISPUTA')).toEqual(permitida)
    expect(permiso(congelada, arbitro, 'EMITIR_DICTAMEN')).toEqual(negada('El ticket no puede resolverse con esos datos'))
    expect(permiso(congelada, capitanAlfa, 'TOMAR_DISPUTA')).toEqual(negada('No tienes permiso para esta acción'))
  })

  it('solo el árbitro asignado emite el dictamen', () => {
    const tomada = partida({ estado: 'CONGELADA', fechaFin: FIN, disputa: disputaAbierta(arbitro) })
    expect(permiso(tomada, arbitro, 'EMITIR_DICTAMEN')).toEqual(permitida)
    expect(permiso(tomada, arbitro, 'TOMAR_DISPUTA')).toEqual(negada('El ticket ya no está disponible'))
    expect(permiso(tomada, otroArbitro, 'EMITIR_DICTAMEN')).toEqual(negada('El ticket no puede resolverse con esos datos'))
  })

  it('sin disputa no hay nada que tomar', () => {
    expect(permiso(partida({ estado: 'EN_CURSO' }), arbitro, 'TOMAR_DISPUTA')).toEqual(negada('La partida no tiene disputa'))
  })
})

describe('validarMarcador', () => {
  const noEntero = 'Escribe los dos marcadores como números enteros, de 0 en adelante.'
  const empate = 'En eliminación simple no hay empates: el marcador tiene que tener un ganador.'

  it('acepta dos enteros de 0 en adelante con un ganador', () => {
    expect(validarMarcador(2, 1)).toBeNull()
    expect(validarMarcador(0, 3)).toBeNull()
  })

  it('rechaza negativos, decimales y campos vacíos', () => {
    expect(validarMarcador(-1, 2)).toBe(noEntero)
    expect(validarMarcador(2, 1.5)).toBe(noEntero)
    expect(validarMarcador(Number.NaN, 1)).toBe(noEntero)
  })

  it('rechaza el empate comparando números, no texto', () => {
    expect(validarMarcador(2, 2)).toBe(empate)
    expect(validarMarcador(Number('01'), Number('1'))).toBe(empate)
  })
})

describe('evidencia', () => {
  it('valida formato y tamaño con los mensajes de Evidencia.validar', () => {
    expect(validarArchivoEvidencia({ tipo: 'image/gif', tamanoBytes: 1000 })).toBe('La evidencia debe ser PNG o JPG')
    expect(validarArchivoEvidencia({ tipo: 'image/png', tamanoBytes: 5 * 1024 * 1024 + 1 })).toBe(
      'La evidencia excede el tamaño máximo permitido',
    )
    expect(validarArchivoEvidencia({ tipo: 'image/jpeg', tamanoBytes: 5 * 1024 * 1024 })).toBeNull()
  })

  it('la ventana pasa de sin fin a abierta a cerrada', () => {
    expect(ventanaDeEvidencia(null, FIN)).toEqual({ estado: 'SIN_FIN' })
    expect(ventanaDeEvidencia(FIN, despuesDelFin(2))).toMatchObject({ estado: 'ABIERTA', restanteMs: 3 * MINUTO })
    expect(ventanaDeEvidencia(FIN, despuesDelFin(6))).toMatchObject({ estado: 'CERRADA' })
  })
})

describe('torneo', () => {
  const inscrito = (id: string): EquipoInscrito => ({ id, nombre: id, capitanId: `cap-${id}`, totalIntegrantes: 4 })
  const resumen = (id: string, a: string, b: string, ganadorId: string | null): PartidaResumen => ({
    id,
    torneoId: 't',
    ronda: 1,
    equipos: [
      { id: a, nombre: a },
      { id: b, nombre: b },
    ],
    estado: ganadorId ? 'FINALIZADA' : 'EN_CURSO',
    fechaProgramada: FIN,
    fechaFin: null,
    ganadorId,
    marcador: null,
  })

  it('cerrar inscripciones pide 4 equipos y un torneo activo', () => {
    expect(motivoParaNoCerrar({ estado: 'ACTIVO', equipos: ['a', 'b', 'c'].map(inscrito) })).toBe('Se requieren al menos 4 equipos')
    expect(motivoParaNoCerrar({ estado: 'ACTIVO', equipos: ['a', 'b', 'c', 'd'].map(inscrito) })).toBeNull()
    expect(motivoParaNoCerrar({ estado: 'EN_CURSO', equipos: ['a', 'b', 'c', 'd'].map(inscrito) })).toBe('El torneo ya no está activo')
  })

  it('avanzan el pase automático primero y luego los ganadores en orden', () => {
    const ronda: Ronda = {
      numero: 1,
      partidas: [resumen('1', 'a', 'b', 'b'), resumen('2', 'c', 'd', 'c')],
      paseAutomatico: { id: 'e', nombre: 'e' },
    }
    expect(equiposQueAvanzan(ronda).map((equipo) => equipo.id)).toEqual(['e', 'b', 'c'])
  })

  it('no se genera otra ronda si la anterior no terminó o si ya hay campeón', () => {
    const incompleta: Ronda = { numero: 1, partidas: [resumen('1', 'a', 'b', null)], paseAutomatico: null }
    expect(motivoParaNoGenerarRonda({ rondas: [incompleta] })).toBe('La ronda anterior aún no está completa')
    const final: Ronda = { numero: 3, partidas: [resumen('1', 'a', 'b', 'a')], paseAutomatico: null }
    expect(campeon({ rondas: [final] })).toEqual({ id: 'a', nombre: 'a' })
    expect(motivoParaNoGenerarRonda({ rondas: [final] })).toBe('El torneo ya tiene campeón')
    expect(motivoParaNoGenerarRonda({ rondas: [] })).toBe('El torneo todavía no tiene rondas: primero hay que cerrar inscripciones')
  })

  it('el marcador validado se ordena como los equipos de la partida', () => {
    const reportes = [
      { equipoId: BETA.id, capitanId: capitanBeta.id, marcadorPropio: 1, marcadorRival: 2, fecha: FIN },
      { equipoId: ALFA.id, capitanId: capitanAlfa.id, marcadorPropio: 2, marcadorRival: 1, fecha: FIN },
    ]
    expect(marcadorValidado([ALFA, BETA], reportes)).toEqual({ equipoA: 2, equipoB: 1 })
    expect(marcadorValidado([ALFA, BETA], reportes.slice(0, 1))).toBeNull()
  })
})
