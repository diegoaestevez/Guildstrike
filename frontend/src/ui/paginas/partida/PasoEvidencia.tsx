import { CircleCheck, FileImage, Hourglass, ImageUp, TimerOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LIMITE_EVIDENCIA_MINUTOS, validarArchivoEvidencia, ventanaDeEvidencia } from '../../../dominio/evidencia'
import { partidaAdmiteCambios, type Permiso } from '../../../dominio/partida'
import type { EquipoRef, Partida } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton } from '../../componentes/Boton'
import { Campo } from '../../componentes/Campo'
import { Hora } from '../../componentes/Hora'
import { useAgregarEvidencia } from '../../consultas/acciones'
import { cuentaRegresiva, tamano } from '../../formato'

const LIMITE_MS = LIMITE_EVIDENCIA_MINUTOS * 60_000

function Ventana({ partida, ahora }: { partida: Partida; ahora: Date }) {
  const ventana = ventanaDeEvidencia(partida.fechaFin, ahora)
  if (ventana.estado === 'SIN_FIN') {
    return (
      <p className="flex items-center gap-2 text-sm text-texto-2">
        <Hourglass aria-hidden className="size-4 shrink-0" />
        La ventana de {LIMITE_EVIDENCIA_MINUTOS} minutos se abre cuando alguien termina la partida.
      </p>
    )
  }
  if (ventana.estado === 'CERRADA') {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-texto-2">
        <TimerOff aria-hidden className="size-4 shrink-0" />
        La ventana cerró a las <Hora fecha={ventana.cerro} formato="exacta" className="text-texto" />
      </p>
    )
  }
  const restante = ventana.restanteMs / LIMITE_MS
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-texto-2">Tiempo para subir evidencia</span>
        {/* La cuenta no se anuncia cada segundo: el lector de pantalla lee la hora de cierre de abajo. */}
        <span className="font-datos text-xl tabular-nums text-oro" aria-hidden>
          {cuentaRegresiva(ventana.restanteMs)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-borde">
        <div className="h-full rounded-full bg-oro transition-[width] duration-1000 ease-linear" style={{ width: `${restante * 100}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-texto-2">
        Cierra a las <Hora fecha={ventana.cierra} formato="exacta" />
      </p>
    </div>
  )
}

interface Props {
  partida: Partida
  equipo: EquipoRef
  permiso: Permiso
  ahora: Date
}

/** RF-04: el capitán sube su captura, validada aquí con las reglas del modelo antes de enviarla. */
export function PasoEvidencia({ partida, equipo, permiso, ahora }: Props) {
  const agregar = useAgregarEvidencia(partida.id)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const propias = partida.evidencias.filter((evidencia) => evidencia.equipoId === equipo.id)

  const elegir = (elegido: File | null) => {
    agregar.reset()
    setArchivo(elegido)
    setErrorLocal(elegido ? validarArchivoEvidencia({ tipo: elegido.type, tamanoBytes: elegido.size }) : null)
  }

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const formulario = evento.currentTarget
    if (!archivo) {
      setErrorLocal('Elige una imagen PNG o JPG')
      return
    }
    const problema = validarArchivoEvidencia({ tipo: archivo.type, tamanoBytes: archivo.size })
    if (problema) {
      setErrorLocal(problema)
      return
    }
    agregar.mutate(
      { nombre: archivo.name, tipo: archivo.type, tamanoBytes: archivo.size, contenido: archivo },
      {
        onSuccess: () => {
          setArchivo(null)
          formulario.reset()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {partidaAdmiteCambios(partida.estado) && <Ventana partida={partida} ahora={ahora} />}

      {propias.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {propias.map((evidencia) => (
            <li key={`${evidencia.nombre}-${evidencia.fechaCarga.getTime()}`} className="flex items-center gap-2 text-sm">
              <CircleCheck aria-hidden className="size-4 shrink-0 text-finalizada" />
              <span className="min-w-0 truncate font-datos text-xs">{evidencia.nombre}</span>
              <span className="shrink-0 text-xs text-texto-2">
                <Hora fecha={evidencia.fechaCarga} formato="exacta" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {permiso.permitida ? (
        <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
          <Campo etiqueta="Captura del marcador final" ayuda="PNG o JPG, máximo 5 MB.">
            {(control) => (
              // El control nativo queda oculto pero enfocable; el botón visible es su etiqueta.
              <div className="flex min-w-0 items-center gap-3">
                <input
                  {...control}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(evento) => elegir(evento.target.files?.[0] ?? null)}
                  aria-invalid={errorLocal ? true : undefined}
                  className="peer sr-only"
                />
                <label
                  htmlFor={control.id}
                  className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-borde bg-elevada px-3 py-2 text-sm hover:border-texto-2/60 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-oro peer-focus-visible:outline-solid"
                >
                  <FileImage aria-hidden className="size-4" />
                  Elegir imagen
                </label>
                <span className={`min-w-0 truncate text-xs ${archivo ? 'font-datos text-texto' : 'text-texto-2'}`}>
                  {archivo ? `${archivo.name} · ${tamano(archivo.size)}` : 'Ningún archivo elegido'}
                </span>
              </div>
            )}
          </Campo>
          <AvisoDeError mensaje={errorLocal} error={agregar.error} />
          <div>
            <Boton type="submit" variante="principal" icono={ImageUp} cargando={agregar.isPending} disabled={!archivo || errorLocal !== null}>
              Subir evidencia
            </Boton>
          </div>
        </form>
      ) : (
        propias.length === 0 && partida.fechaFin && <p className="text-sm text-texto-2">{permiso.motivo}</p>
      )}
    </div>
  )
}
