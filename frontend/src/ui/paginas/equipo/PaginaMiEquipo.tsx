import { Crown, Trophy, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { estadoRoster, ROSTER_MAXIMO, ROSTER_MINIMO } from '../../../dominio/equipo'
import type { Equipo } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton, EnlaceBoton } from '../../componentes/Boton'
import { Campo, CLASE_CONTROL } from '../../componentes/Campo'
import { Cargando } from '../../componentes/Cargando'
import { EncabezadoPagina } from '../../componentes/EncabezadoPagina'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { Seccion } from '../../componentes/Seccion'
import { SoloPara } from '../../componentes/SoloPara'
import { useAgregarIntegrante } from '../../consultas/acciones'
import { useEquipo } from '../../consultas/lecturas'
import { useSesion } from '../../proveedores/contextos'

/** El roster de 4 a 9 a la vista: una casilla por lugar y la marca del mínimo. */
function MedidorRoster({ total }: { total: number }) {
  const { valido, faltanParaMinimo, lleno } = estadoRoster(total)
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-datos text-2xl tabular-nums">{total}</span>
          <span className="text-texto-2"> de {ROSTER_MAXIMO} integrantes</span>
        </p>
        <p className={`text-sm ${valido ? 'text-finalizada' : 'text-oro'}`}>
          {lleno
            ? 'Roster completo'
            : valido
              ? 'Puede inscribirse en torneos'
              : `Falta${faltanParaMinimo === 1 ? '' : 'n'} ${faltanParaMinimo} para poder inscribirse`}
        </p>
      </div>
      <div
        role="meter"
        aria-label="Integrantes del roster"
        aria-valuemin={0}
        aria-valuemax={ROSTER_MAXIMO}
        aria-valuenow={total}
        aria-valuetext={`${total} de ${ROSTER_MAXIMO}; mínimo ${ROSTER_MINIMO}`}
        className="mt-3 grid grid-cols-9 gap-1"
      >
        {Array.from({ length: ROSTER_MAXIMO }, (_, indice) => (
          <span key={indice} className="flex flex-col gap-1">
            <span className={`h-2 rounded-full ${indice < total ? (valido ? 'bg-finalizada' : 'bg-oro') : 'bg-borde'}`} />
            <span aria-hidden className="text-center font-datos text-[0.65rem] text-texto-2">
              {indice === ROSTER_MINIMO - 1 ? 'mín.' : '\u00a0'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function AgregarIntegrante({ equipo }: { equipo: Equipo }) {
  const agregar = useAgregarIntegrante(equipo.id)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const lleno = estadoRoster(equipo.integrantes.length).lleno

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setAviso(null)
    if (!nombre.trim() || !correo.trim()) {
      setErrorLocal('Escribe el nombre y el correo del integrante.')
      return
    }
    setErrorLocal(null)
    agregar.mutate(
      { nombre: nombre.trim(), correo: correo.trim() },
      {
        onSuccess: () => {
          setAviso(`${nombre.trim()} ya es parte del roster.`)
          setNombre('')
          setCorreo('')
        },
      },
    )
  }

  if (lleno) {
    return <p className="text-sm text-texto-2">El roster está completo: un equipo tiene como máximo {ROSTER_MAXIMO} integrantes.</p>
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
      <div className="grid gap-3">
        <Campo etiqueta="Nombre">
          {(control) => (
            <input {...control} autoComplete="off" value={nombre} onChange={(evento) => setNombre(evento.target.value)} className={CLASE_CONTROL} />
          )}
        </Campo>
        <Campo etiqueta="Correo" ayuda="Identifica a la persona: no puede estar en dos equipos.">
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="off"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              className={CLASE_CONTROL}
            />
          )}
        </Campo>
      </div>
      <AvisoDeError mensaje={errorLocal} error={agregar.error} />
      <p aria-live="polite" className="text-sm text-finalizada">
        {aviso}
      </p>
      <div>
        <Boton type="submit" variante="principal" icono={UserPlus} cargando={agregar.isPending}>
          Agregar integrante
        </Boton>
      </div>
    </form>
  )
}

function Roster({ equipo }: { equipo: Equipo }) {
  return (
    <ul className="divide-y divide-borde rounded-md border border-borde">
      <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-elevada px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Crown aria-hidden className="size-4 text-oro" />
          {equipo.capitan.nombre}
        </span>
        <span className="text-xs text-texto-2">Capitán · no cuenta en el roster</span>
      </li>
      {equipo.integrantes.map((integrante, indice) => (
        <li key={integrante.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-3 text-sm">
            <span className="font-datos text-xs text-texto-2 tabular-nums">{String(indice + 1).padStart(2, '0')}</span>
            <span className="truncate">{integrante.nombre}</span>
          </span>
          <span className="min-w-0 truncate font-datos text-xs text-texto-2">{integrante.correo}</span>
        </li>
      ))}
    </ul>
  )
}

function ContenidoMiEquipo() {
  const { usuario } = useSesion()
  const consulta = useEquipo(usuario.equipo?.id ?? null)

  if (!usuario.equipo) {
    return <p className="text-sm text-texto-2">Tu cuenta de capitán no tiene equipo asignado.</p>
  }
  if (consulta.isPending) {
    return <Cargando etiqueta="Cargando tu equipo" lineas={2} />
  }
  if (consulta.isError && !consulta.data) {
    return <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
  }
  const equipo = consulta.data
  const { valido } = estadoRoster(equipo.integrantes.length)
  return (
    <>
      <EncabezadoPagina
        titulo={equipo.nombre}
        migas={[{ etiqueta: 'Mi equipo' }]}
        descripcion={`El roster va de ${ROSTER_MINIMO} a ${ROSTER_MAXIMO} integrantes, sin contar al capitán. Con menos de ${ROSTER_MINIMO}, el equipo no puede inscribirse.`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <Seccion titulo="Roster">
          <MedidorRoster total={equipo.integrantes.length} />
          <div className="mt-5">
            <Roster equipo={equipo} />
          </div>
        </Seccion>
        <div className="flex flex-col gap-6">
          <Seccion titulo="Agregar integrante">
            <AgregarIntegrante equipo={equipo} />
          </Seccion>
          {valido && (
            <Seccion titulo="Torneos">
              <p className="text-sm text-texto-2">Tu equipo cumple el roster. Inscríbelo en un torneo con inscripciones abiertas.</p>
              <EnlaceBoton to="/torneos" icono={Trophy} className="mt-3">
                Ver torneos
              </EnlaceBoton>
            </Seccion>
          )}
        </div>
      </div>
    </>
  )
}

export function PaginaMiEquipo() {
  return (
    <SoloPara roles={['CAPITAN']}>
      <ContenidoMiEquipo />
    </SoloPara>
  )
}
