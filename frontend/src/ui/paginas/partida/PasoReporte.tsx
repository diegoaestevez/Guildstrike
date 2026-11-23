import { CircleCheck, Send, TriangleExclamationPoint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ventanaDeEvidencia } from '../../../dominio/evidencia'
import { rivalDe, validarMarcador, type Permiso } from '../../../dominio/partida'
import type { EquipoRef, Partida } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton } from '../../componentes/Boton'
import { Campo, CLASE_CONTROL } from '../../componentes/Campo'
import { Hora } from '../../componentes/Hora'
import { useReportarResultado } from '../../consultas/acciones'

interface Props {
  partida: Partida
  equipo: EquipoRef
  permiso: Permiso
  ahora: Date
}

/** Texto del campo a número; un campo vacío no es 0 sino un marcador que falta. */
const aNumero = (texto: string) => (texto.trim() === '' ? Number.NaN : Number(texto))

/** RF-05: el capitán reporta su marcador; si coincide con el del rival, el sistema valida la partida. */
export function PasoReporte({ partida, equipo, permiso, ahora }: Props) {
  const reportar = useReportarResultado(partida.id)
  const [propio, setPropio] = useState('')
  const [rival, setRival] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const equipoRival = rivalDe(partida, equipo.id)
  const miReporte = partida.reportes.find((reporte) => reporte.equipoId === equipo.id)

  if (miReporte) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <CircleCheck aria-hidden className="size-4 shrink-0 text-finalizada" />
        Reportaste
        <span className="font-datos tabular-nums">
          {miReporte.marcadorPropio}–{miReporte.marcadorRival}
        </span>
        a las <Hora fecha={miReporte.fecha} formato="exacta" />
      </p>
    )
  }
  if (!permiso.permitida) {
    return <p className="text-sm text-texto-2">{permiso.motivo}</p>
  }

  const sinEvidenciaPropia = !partida.evidencias.some((evidencia) => evidencia.equipoId === equipo.id)
  const ventanaAbierta = ventanaDeEvidencia(partida.fechaFin, ahora).estado === 'ABIERTA'

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const marcadorPropio = aNumero(propio)
    const marcadorRival = aNumero(rival)
    const problema = validarMarcador(marcadorPropio, marcadorRival)
    setErrorLocal(problema)
    if (!problema) {
      reportar.mutate({ marcadorPropio, marcadorRival })
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
      {sinEvidenciaPropia && ventanaAbierta && (
        <p className="flex items-start gap-2 rounded-md border border-oro/40 bg-oro/10 px-3 py-2 text-sm">
          <TriangleExclamationPoint aria-hidden className="mt-0.5 size-4 shrink-0 text-oro" />
          <span>
            Sube primero tu evidencia. Si tu marcador coincide con el del rival, la partida se valida en ese momento y ya no acepta
            evidencias.
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta={<span className="block truncate">{equipo.nombre}</span>} ayuda="Tu equipo">
          {(control) => (
            <input
              {...control}
              inputMode="numeric"
              pattern="[0-9]*"
              value={propio}
              onChange={(evento) => setPropio(evento.target.value)}
              className={`${CLASE_CONTROL} font-datos text-lg tabular-nums`}
            />
          )}
        </Campo>
        <Campo etiqueta={<span className="block truncate">{equipoRival.nombre}</span>} ayuda="Rival">
          {(control) => (
            <input
              {...control}
              inputMode="numeric"
              pattern="[0-9]*"
              value={rival}
              onChange={(evento) => setRival(evento.target.value)}
              className={`${CLASE_CONTROL} font-datos text-lg tabular-nums`}
            />
          )}
        </Campo>
      </div>
      <AvisoDeError mensaje={errorLocal} error={reportar.error} />
      <div>
        <Boton type="submit" variante={sinEvidenciaPropia && ventanaAbierta ? 'secundario' : 'principal'} icono={Send} cargando={reportar.isPending}>
          Enviar marcador
        </Boton>
      </div>
    </form>
  )
}
