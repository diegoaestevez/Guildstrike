import { Gavel } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Partida } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton } from '../../componentes/Boton'
import { Campo, CLASE_CONTROL } from '../../componentes/Campo'
import { useEmitirDictamen } from '../../consultas/acciones'

/** RF-07: el árbitro elige al ganador y justifica; la partida queda AUDITADA. */
export function FormularioDictamen({ partida }: { partida: Partida }) {
  const emitir = useEmitirDictamen(partida.id)
  const [ganadorId, setGanadorId] = useState<string | null>(null)
  const [justificacion, setJustificacion] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!ganadorId) {
      setErrorLocal('Elige al equipo ganador.')
      return
    }
    if (!justificacion.trim()) {
      setErrorLocal('La justificación es obligatoria: queda en el historial de la partida.')
      return
    }
    setErrorLocal(null)
    emitir.mutate({ equipoGanadorId: ganadorId, justificacion: justificacion.trim() })
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Equipo ganador</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {partida.equipos.map((equipo) => (
            <label
              key={equipo.id}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-borde bg-fondo px-3 py-2.5 text-sm has-checked:border-oro has-checked:bg-oro/10"
            >
              <input
                type="radio"
                name="ganador"
                value={equipo.id}
                checked={ganadorId === equipo.id}
                onChange={() => setGanadorId(equipo.id)}
                className="size-4 accent-oro"
              />
              <span className="min-w-0 truncate">{equipo.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Campo etiqueta="Justificación" ayuda="Se guarda tal cual en el historial, junto con tu nombre y la hora exacta.">
        {(control) => (
          <textarea
            {...control}
            rows={4}
            value={justificacion}
            onChange={(evento) => setJustificacion(evento.target.value)}
            placeholder="Qué revisaste y por qué decides así"
            className={CLASE_CONTROL}
          />
        )}
      </Campo>
      <AvisoDeError mensaje={errorLocal} error={emitir.error} />
      <div>
        <Boton type="submit" variante="principal" icono={Gavel} cargando={emitir.isPending}>
          Emitir dictamen
        </Boton>
      </div>
    </form>
  )
}
