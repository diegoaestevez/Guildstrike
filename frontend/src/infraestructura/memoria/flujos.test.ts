import { beforeEach, describe, expect, it } from 'vitest'
import { ErrorDeRegla } from '../../aplicacion/errores'
import type { ArchivoEvidencia, Repositorios } from '../../aplicacion/puertos'
import { crearRepositoriosEnMemoria } from '.'
import { capitanDe, equipoDe, ID_ADMINISTRADOR, ID_ARBITRO } from './semilla'

// Flujos completos contra el backend simulado, sobre la semilla de demostración y con el
// reloj fijo. Los mensajes van literales, copiados de backend/models.

const MINUTO = 60_000
const MB = 1024 * 1024
const INICIO = new Date('2026-11-20T18:00:00Z')

let ahora = INICIO
const avanzar = (minutos: number) => {
  ahora = new Date(ahora.getTime() + minutos * MINUTO)
}
let repos: Repositorios

beforeEach(() => {
  ahora = INICIO
  repos = crearRepositoriosEnMemoria({ latenciaMs: 0, reloj: () => new Date(ahora) })
})

/** La promesa se rechaza con ErrorDeRegla y exactamente ese mensaje. */
async function rechazaCon(promesa: Promise<unknown>, mensaje: string) {
  const error = await promesa.then(
    () => null,
    (motivo: unknown) => motivo,
  )
  expect(error).toBeInstanceOf(ErrorDeRegla)
  expect((error as ErrorDeRegla).message).toBe(mensaje)
}

const captura = (cambios: Partial<ArchivoEvidencia> = {}): ArchivoEvidencia => ({
  nombre: 'captura.png',
  tipo: 'image/png',
  tamanoBytes: MB,
  contenido: new Blob(['captura']),
  ...cambios,
})

const LIGA = 'liga-invierno'
const COPA = 'copa-relampago'

describe('RF-01: inscribir a un equipo', () => {
  it('el capitán inscribe a su equipo en un torneo activo', async () => {
    const torneo = await repos.torneos.inscribirEquipo(capitanDe('zafiro'), LIGA, equipoDe('zafiro'))
    expect(torneo.equipos.map((equipo) => equipo.id)).toContain(equipoDe('zafiro'))
    expect(torneo.equipos).toHaveLength(4)
  })

  it('rechaza un torneo que no está activo', async () => {
    await rechazaCon(repos.torneos.inscribirEquipo(capitanDe('brujula'), COPA, equipoDe('brujula')), 'El torneo no acepta inscripciones')
  })

  it('rechaza un equipo con menos de 4 integrantes', async () => {
    await rechazaCon(
      repos.torneos.inscribirEquipo(capitanDe('brujula'), LIGA, equipoDe('brujula')),
      'El equipo debe tener entre 4 y 9 integrantes',
    )
  })

  it('rechaza un equipo ya inscrito', async () => {
    await rechazaCon(repos.torneos.inscribirEquipo(capitanDe('colmena'), LIGA, equipoDe('colmena')), 'El equipo ya está inscrito')
  })

  it('un capitán no inscribe a un equipo ajeno', async () => {
    await rechazaCon(repos.torneos.inscribirEquipo(capitanDe('zafiro'), LIGA, equipoDe('kraken')), 'No tienes permiso para esta acción')
  })
})

describe('RF-02: cerrar inscripciones', () => {
  it('con 3 equipos no cierra y el torneo sigue activo', async () => {
    await rechazaCon(repos.torneos.cerrarInscripciones(ID_ADMINISTRADOR, LIGA), 'Se requieren al menos 4 equipos')
    expect((await repos.torneos.obtener(LIGA)).estado).toBe('ACTIVO')
  })

  it('con 5 equipos genera 2 partidas en orden y un pase automático', async () => {
    await repos.torneos.inscribirEquipo(capitanDe('zafiro'), LIGA, equipoDe('zafiro'))
    await repos.torneos.inscribirEquipo(capitanDe('kraken'), LIGA, equipoDe('kraken'))
    const torneo = await repos.torneos.cerrarInscripciones(ID_ADMINISTRADOR, LIGA)
    expect(torneo.estado).toBe('EN_CURSO')
    expect(torneo.rondas).toHaveLength(1)
    const [ronda] = torneo.rondas
    expect(ronda?.partidas.map((partida) => partida.equipos.map((equipo) => equipo.id))).toEqual([
      [equipoDe('colmena'), equipoDe('nomadas')],
      [equipoDe('lobos'), equipoDe('zafiro')],
    ])
    expect(ronda?.partidas.every((partida) => partida.estado === 'PROGRAMADA')).toBe(true)
    expect(ronda?.paseAutomatico?.id).toBe(equipoDe('kraken'))
    await rechazaCon(repos.torneos.cerrarInscripciones(ID_ADMINISTRADOR, LIGA), 'El torneo ya no está activo')
  })

  it('solo el administrador cierra', async () => {
    await rechazaCon(repos.torneos.cerrarInscripciones(capitanDe('colmena'), LIGA), 'No tienes permiso para esta acción')
  })
})

describe('RF-04 y RF-05: evidencia y reportes', () => {
  const PARTIDA = `${COPA}-1-4` // Furia Austral vs Eclipse Tapatío, EN_CURSO
  const furia = capitanDe('furia')
  const eclipse = capitanDe('eclipse')

  it('reportes que coinciden dejan la partida FINALIZADA con ganador y marcador', async () => {
    await repos.partidas.terminar(furia, PARTIDA)
    avanzar(2)
    const conEvidencia = await repos.partidas.agregarEvidencia(furia, PARTIDA, captura())
    expect(conEvidencia.evidencias).toHaveLength(1)
    await repos.partidas.reportarResultado(furia, PARTIDA, { marcadorPropio: 2, marcadorRival: 1 })
    const partida = await repos.partidas.reportarResultado(eclipse, PARTIDA, { marcadorPropio: 1, marcadorRival: 2 })
    expect(partida.estado).toBe('FINALIZADA')
    expect(partida.ganadorId).toBe(equipoDe('furia'))
    expect(partida.marcador).toEqual({ equipoA: 2, equipoB: 1 })
    expect(partida.eventos.map((evento) => evento.tipo)).toEqual([
      'PARTIDA_INICIADA',
      'EVIDENCIA_AGREGADA',
      'RESULTADO_REPORTADO',
      'RESULTADO_REPORTADO',
      'RESULTADO_VALIDADO',
    ])
    // Regla del modelo que la pantalla tiene que anticipar: validada, ya no recibe evidencia.
    await rechazaCon(repos.partidas.agregarEvidencia(eclipse, PARTIDA, captura()), 'La partida no admite más cambios')
  })

  it('reportes distintos congelan la partida y abren una disputa', async () => {
    const programada = `${COPA}-1-5` // Zafiro Clan vs Titanes de Hierro
    await repos.partidas.iniciar(ID_ADMINISTRADOR, programada)
    await repos.partidas.terminar(ID_ADMINISTRADOR, programada)
    await repos.partidas.reportarResultado(capitanDe('zafiro'), programada, { marcadorPropio: 2, marcadorRival: 1 })
    const partida = await repos.partidas.reportarResultado(capitanDe('titanes'), programada, { marcadorPropio: 2, marcadorRival: 1 })
    expect(partida.estado).toBe('CONGELADA')
    expect(partida.ganadorId).toBeNull()
    expect(partida.disputa).toMatchObject({ estado: 'ABIERTO', motivo: 'Marcadores discrepantes', solicitante: { id: capitanDe('titanes') } })
    expect(partida.eventos.at(-1)?.tipo).toBe('DISPUTA_ABIERTA')
    await rechazaCon(
      repos.partidas.reportarResultado(capitanDe('zafiro'), programada, { marcadorPropio: 1, marcadorRival: 0 }),
      'La partida no admite más cambios',
    )
  })

  it('solo se inicia una partida programada', async () => {
    await rechazaCon(repos.partidas.iniciar(ID_ADMINISTRADOR, PARTIDA), 'Se esperaba estado PROGRAMADA')
  })

  it('un marcador negativo se rechaza', async () => {
    await repos.partidas.terminar(furia, PARTIDA)
    await rechazaCon(
      repos.partidas.reportarResultado(furia, PARTIDA, { marcadorPropio: -1, marcadorRival: 2 }),
      'El reporte de resultado es inválido',
    )
  })

  // Rareza heredada de Partida._validarReportes: un empate coincide y gana el segundo en reportar,
  // porque `2 > 2` es falso. El simulador lo replica; el formulario no deja enviar empates.
  it('un empate coincidente se valida como en el modelo: gana el segundo en reportar', async () => {
    await repos.partidas.terminar(furia, PARTIDA)
    await repos.partidas.reportarResultado(furia, PARTIDA, { marcadorPropio: 2, marcadorRival: 2 })
    const partida = await repos.partidas.reportarResultado(eclipse, PARTIDA, { marcadorPropio: 2, marcadorRival: 2 })
    expect(partida.estado).toBe('FINALIZADA')
    expect(partida.ganadorId).toBe(equipoDe('eclipse'))
  })

  it('el mismo equipo no reporta dos veces y un capitán ajeno no reporta', async () => {
    await repos.partidas.terminar(furia, PARTIDA)
    await repos.partidas.reportarResultado(furia, PARTIDA, { marcadorPropio: 2, marcadorRival: 0 })
    await rechazaCon(repos.partidas.reportarResultado(furia, PARTIDA, { marcadorPropio: 2, marcadorRival: 0 }), 'El equipo ya reportó un resultado')
    await rechazaCon(
      repos.partidas.reportarResultado(capitanDe('kraken'), PARTIDA, { marcadorPropio: 2, marcadorRival: 0 }),
      'El capitán no participa en esta partida',
    )
  })

  describe('evidencia rechazada', () => {
    it('antes de terminar la partida', async () => {
      await rechazaCon(repos.partidas.agregarEvidencia(furia, PARTIDA, captura()), 'La evidencia sólo se recibe al finalizar la partida')
    })

    it('por formato', async () => {
      await repos.partidas.terminar(furia, PARTIDA)
      await rechazaCon(
        repos.partidas.agregarEvidencia(furia, PARTIDA, captura({ nombre: 'clip.gif', tipo: 'image/gif' })),
        'La evidencia debe ser PNG o JPG',
      )
    })

    it('por tamaño', async () => {
      await repos.partidas.terminar(furia, PARTIDA)
      await rechazaCon(
        repos.partidas.agregarEvidencia(furia, PARTIDA, captura({ tamanoBytes: 6 * MB })),
        'La evidencia excede el tamaño máximo permitido',
      )
    })

    it('por tiempo: más de 5 minutos después del fin', async () => {
      await repos.partidas.terminar(furia, PARTIDA)
      avanzar(5)
      const enElLimite = await repos.partidas.agregarEvidencia(furia, PARTIDA, captura())
      expect(enElLimite.evidencias).toHaveLength(1)
      avanzar(1)
      await rechazaCon(repos.partidas.agregarEvidencia(eclipse, PARTIDA, captura()), 'La evidencia está fuera del tiempo límite')
    })
  })
})

describe('RF-06 y RF-07: disputa y dictamen', () => {
  const CONGELADA = `${COPA}-1-3` // Nómadas del Sur vs Pixel Brigada, disputa abierta sin árbitro

  it('el árbitro toma la disputa y su dictamen deja la partida AUDITADA', async () => {
    const abiertas = await repos.disputas.listar({ estado: 'ABIERTO' })
    expect(abiertas.map((disputa) => disputa.partidaId)).toEqual([CONGELADA])

    await rechazaCon(
      repos.disputas.emitirDictamen(ID_ARBITRO, CONGELADA, { equipoGanadorId: equipoDe('pixel'), justificacion: 'Revisé las capturas' }),
      'El ticket no puede resolverse con esos datos',
    )
    const tomada = await repos.disputas.tomar(ID_ARBITRO, CONGELADA)
    expect(tomada.disputa?.arbitro?.id).toBe(ID_ARBITRO)

    await rechazaCon(
      repos.disputas.emitirDictamen(ID_ARBITRO, CONGELADA, { equipoGanadorId: equipoDe('pixel'), justificacion: '' }),
      'El ticket no puede resolverse con esos datos',
    )
    await rechazaCon(
      repos.disputas.emitirDictamen(ID_ARBITRO, CONGELADA, { equipoGanadorId: equipoDe('kraken'), justificacion: 'Revisé las capturas' }),
      'El ganador debe participar en la partida',
    )

    const partida = await repos.disputas.emitirDictamen(ID_ARBITRO, CONGELADA, {
      equipoGanadorId: equipoDe('pixel'),
      justificacion: 'La captura muestra que el segundo mapa se repitió y lo ganó Pixel Brigada.',
    })
    expect(partida.estado).toBe('AUDITADA')
    expect(partida.ganadorId).toBe(equipoDe('pixel'))
    expect(partida.disputa?.estado).toBe('RESUELTO')
    expect(partida.eventos.at(-1)).toMatchObject({ tipo: 'DICTAMEN_EMITIDO', usuario: { id: ID_ARBITRO } })
    expect(await repos.disputas.listar({ estado: 'ABIERTO' })).toHaveLength(0)
  })

  it('un capitán abre una disputa con motivo y la partida se congela', async () => {
    const PARTIDA = `${COPA}-1-4`
    await rechazaCon(repos.disputas.abrir(capitanDe('furia'), PARTIDA, ''), 'Partida, solicitante y motivo son obligatorios')
    await rechazaCon(repos.disputas.abrir(capitanDe('kraken'), PARTIDA, 'No jugaron'), 'El solicitante no participa en la partida')
    const partida = await repos.disputas.abrir(capitanDe('furia'), PARTIDA, 'El rival usó un personaje vetado')
    expect(partida.estado).toBe('CONGELADA')
    expect(partida.disputa).toMatchObject({ estado: 'ABIERTO', motivo: 'El rival usó un personaje vetado' })
    await rechazaCon(repos.disputas.abrir(capitanDe('eclipse'), PARTIDA, 'Otra'), 'La partida no admite más cambios')
  })

  it('solo un árbitro toma disputas', async () => {
    await rechazaCon(repos.disputas.tomar(capitanDe('pixel'), CONGELADA), 'No tienes permiso para esta acción')
  })
})

describe('siguiente ronda', () => {
  async function completarRondaUno() {
    await repos.disputas.tomar(ID_ARBITRO, `${COPA}-1-3`)
    await repos.disputas.emitirDictamen(ID_ARBITRO, `${COPA}-1-3`, { equipoGanadorId: equipoDe('nomadas'), justificacion: 'Capturas' })
    for (const [partidaId, a, b] of [
      [`${COPA}-1-4`, 'furia', 'eclipse'],
      [`${COPA}-1-5`, 'zafiro', 'titanes'],
    ] as const) {
      const partida = await repos.partidas.obtener(partidaId)
      if (partida.estado === 'PROGRAMADA') await repos.partidas.iniciar(ID_ADMINISTRADOR, partidaId)
      await repos.partidas.terminar(ID_ADMINISTRADOR, partidaId)
      await repos.partidas.reportarResultado(capitanDe(a), partidaId, { marcadorPropio: 0, marcadorRival: 2 })
      await repos.partidas.reportarResultado(capitanDe(b), partidaId, { marcadorPropio: 2, marcadorRival: 0 })
    }
  }

  it('no se genera mientras la ronda anterior no esté completa', async () => {
    await rechazaCon(repos.torneos.generarSiguienteRonda(ID_ADMINISTRADOR, COPA), 'La ronda anterior aún no está completa')
  })

  it('avanzan los ganadores y el pase automático, no todos los inscritos', async () => {
    await completarRondaUno()
    const torneo = await repos.torneos.generarSiguienteRonda(ID_ADMINISTRADOR, COPA)
    const ronda = torneo.rondas[1]
    expect(ronda?.numero).toBe(2)
    expect(ronda?.partidas.map((partida) => partida.equipos.map((equipo) => equipo.id))).toEqual([
      [equipoDe('lobos'), equipoDe('halcones')],
      [equipoDe('vertice'), equipoDe('nomadas')],
      [equipoDe('eclipse'), equipoDe('titanes')],
    ])
    expect(ronda?.paseAutomatico).toBeNull()
  })
})

describe('Mi equipo: agregar integrantes', () => {
  const BRUJULA = equipoDe('brujula')
  const capitan = capitanDe('brujula')

  it('con el cuarto integrante el equipo ya puede inscribirse', async () => {
    const equipo = await repos.equipos.agregarIntegrante(capitan, BRUJULA, { nombre: 'Irene Solís', correo: 'irene.solis@guildstrike.test' })
    expect(equipo.integrantes).toHaveLength(4)
    const torneo = await repos.torneos.inscribirEquipo(capitan, LIGA, BRUJULA)
    expect(torneo.equipos).toHaveLength(4)
  })

  it('aplica las reglas de Equipo.agregarIntegrante', async () => {
    await repos.equipos.agregarIntegrante(capitan, BRUJULA, { nombre: 'Irene Solís', correo: 'irene.solis@guildstrike.test' })
    await rechazaCon(
      repos.equipos.agregarIntegrante(capitan, BRUJULA, { nombre: 'Irene Solís', correo: 'irene.solis@guildstrike.test' }),
      'El integrante ya pertenece al equipo',
    )
    const ajeno = (await repos.equipos.obtener(equipoDe('kraken'))).integrantes[0]
    await rechazaCon(
      repos.equipos.agregarIntegrante(capitan, BRUJULA, { nombre: ajeno?.nombre ?? '', correo: ajeno?.correo ?? '' }),
      'El integrante ya pertenece a otro equipo',
    )
    await rechazaCon(repos.equipos.agregarIntegrante(capitan, BRUJULA, { nombre: '', correo: 'x@y.test' }), 'id, nombre y correo son obligatorios')
    await rechazaCon(
      repos.equipos.agregarIntegrante(capitanDe('kraken'), BRUJULA, { nombre: 'Otra', correo: 'otra@guildstrike.test' }),
      'No tienes permiso para esta acción',
    )
  })

  it('el roster no pasa de 9', async () => {
    const titanes = equipoDe('titanes') // 6 integrantes
    for (const numero of [1, 2, 3]) {
      await repos.equipos.agregarIntegrante(capitanDe('titanes'), titanes, { nombre: `Refuerzo ${numero}`, correo: `refuerzo${numero}@guildstrike.test` })
    }
    await rechazaCon(
      repos.equipos.agregarIntegrante(capitanDe('titanes'), titanes, { nombre: 'Décimo', correo: 'decimo@guildstrike.test' }),
      'El roster no puede exceder 9 integrantes',
    )
  })
})
