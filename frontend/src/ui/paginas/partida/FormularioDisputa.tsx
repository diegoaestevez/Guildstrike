import { Flag } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton } from '../../componentes/Boton'
import { Campo, CLASE_CONTROL } from '../../componentes/Campo'
import { useAbrirDisputa } from '../../consultas/acciones'

/** RF-06: el capitán reporta un error y abre una disputa; la partida se congela. */
export function FormularioDisputa({ partidaId }: { partidaId: string }) {
  const abrir = useAbrirDisputa(partidaId)
  const [motivo, setMotivo] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErrorLocal('Explica el motivo: es lo primero que leerá el árbitro.')
      return
    }
    setErrorLocal(null)
    abrir.mutate(motivo.trim())
  }

  return (
    <details className="group rounded-md border border-borde">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2.5 text-sm text-texto-2 hover:text-texto">
        <Flag aria-hidden className="size-4 text-abierto" />
        ¿Algo no cuadra? Abrir una disputa
      </summary>
      <form onSubmit={enviar} className="flex flex-col gap-3 border-t border-borde p-3" noValidate>
        <p className="text-sm text-texto-2">
          La partida queda <span className="font-datos text-congelada">CONGELADA</span>: no acepta reportes ni evidencias hasta que un
          árbitro emita su dictamen.
        </p>
        <Campo etiqueta="Motivo">
          {(control) => (
            <textarea
              {...control}
              rows={3}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Qué pasó y qué muestra tu evidencia"
              className={CLASE_CONTROL}
            />
          )}
        </Campo>
        <AvisoDeError mensaje={errorLocal} error={abrir.error} />
        <div>
          <Boton type="submit" variante="peligro" icono={Flag} cargando={abrir.isPending}>
            Abrir disputa
          </Boton>
        </div>
      </form>
    </details>
  )
}
