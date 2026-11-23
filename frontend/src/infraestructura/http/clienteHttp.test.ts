import { describe, expect, it } from 'vitest'
import { ErrorDeConexion, ErrorDeRegla } from '../../aplicacion/errores'
import { crearClienteHttp } from './clienteHttp'
import type { PartidaDTO } from './dto'
import { crearRepositoriosHttp } from './repositoriosHttp'

// El adaptador HTTP contra un fetch falso: lo que sale (ruta, encabezado, cuerpo) y cómo
// se traduce lo que vuelve (errores de la API, fechas ISO).

interface Llamada {
  url: string
  metodo: string | undefined
  encabezados: Record<string, string>
  cuerpo: unknown
}

function fetchFalso(estado: number, respuesta: unknown) {
  const llamadas: Llamada[] = []
  const falso: typeof fetch = async (entrada, inicio) => {
    llamadas.push({
      url: String(entrada),
      metodo: inicio?.method,
      encabezados: (inicio?.headers ?? {}) as Record<string, string>,
      cuerpo: inicio?.body,
    })
    return new Response(JSON.stringify(respuesta), { status: estado, headers: { 'Content-Type': 'application/json' } })
  }
  return { falso, llamadas }
}

describe('clienteHttp', () => {
  it('manda quién actúa en X-Usuario-Id y el cuerpo como JSON', async () => {
    const { falso, llamadas } = fetchFalso(200, { ok: true })
    await crearClienteHttp({ fetch: falso }).post('/api/torneos/t1/equipos', { actorId: 'cap-1', cuerpo: { equipoId: 'eq-1' } })
    expect(llamadas[0]).toMatchObject({
      url: '/api/torneos/t1/equipos',
      metodo: 'POST',
      encabezados: { 'X-Usuario-Id': 'cap-1', 'Content-Type': 'application/json' },
      cuerpo: '{"equipoId":"eq-1"}',
    })
  })

  it('un 4xx con { error } se vuelve ErrorDeRegla con el mensaje del modelo', async () => {
    const { falso } = fetchFalso(400, { error: 'El equipo ya está inscrito' })
    const error = await crearClienteHttp({ fetch: falso }).get('/api/torneos').catch((motivo: unknown) => motivo)
    expect(error).toBeInstanceOf(ErrorDeRegla)
    expect(error).toMatchObject({ message: 'El equipo ya está inscrito', codigo: 400 })
  })

  it('un 5xx o una red caída se vuelven ErrorDeConexion', async () => {
    const { falso } = fetchFalso(500, { error: 'boom' })
    await expect(crearClienteHttp({ fetch: falso }).get('/api/torneos')).rejects.toBeInstanceOf(ErrorDeConexion)
    const sinRed: typeof fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    await expect(crearClienteHttp({ fetch: sinRed }).get('/api/torneos')).rejects.toBeInstanceOf(ErrorDeConexion)
  })
})

describe('repositoriosHttp', () => {
  it('convierte las fechas ISO de la partida en Date', async () => {
    const dto: PartidaDTO = {
      id: 't1-1-1',
      torneoId: 't1',
      torneoNombre: 'Copa',
      ronda: 1,
      equipos: [
        { id: 'a', nombre: 'A' },
        { id: 'b', nombre: 'B' },
      ],
      estado: 'CONGELADA',
      fechaProgramada: '2026-11-20T18:00:00.000Z',
      fechaFin: '2026-11-20T18:40:00.000Z',
      ganadorId: null,
      marcador: null,
      reportes: [],
      evidencias: [],
      disputa: null,
      eventos: [{ tipo: 'PARTIDA_INICIADA', usuario: null, descripcion: 'La partida inició', fecha: '2026-11-20T18:01:00.000Z' }],
    }
    const { falso, llamadas } = fetchFalso(200, dto)
    const partida = await crearRepositoriosHttp(crearClienteHttp({ fetch: falso })).partidas.obtener('t1-1-1')
    expect(llamadas[0]?.url).toBe('/api/partidas/t1-1-1')
    expect(partida.fechaFin).toEqual(new Date('2026-11-20T18:40:00.000Z'))
    expect(partida.eventos[0]?.fecha).toBeInstanceOf(Date)
  })
})
