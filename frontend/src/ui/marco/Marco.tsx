import { FlaskConical, Swords } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { ROL } from '../presentacion'
import { useSesion } from '../proveedores/contextos'
import { navegacionPara, type EntradaNavegacion } from './navegacion'
import { SelectorSesion } from './SelectorSesion'

function Marca() {
  return (
    <Link to="/torneos" className="flex items-center gap-2.5 rounded-md">
      <span className="grid size-8 place-items-center rounded-md border border-oro/40 bg-oro/10 text-oro">
        <Swords aria-hidden className="size-4.5" />
      </span>
      <span className="font-titulo text-lg font-bold tracking-wider uppercase">Guildstrike</span>
    </Link>
  )
}

function AvisoDemostracion() {
  return (
    <span
      title="No hay autenticación todavía: eliges con qué usuario entrar. La API validará cada permiso de nuevo."
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-borde bg-elevada px-2.5 py-0.5 text-xs text-texto-2"
    >
      <FlaskConical aria-hidden className="size-3.5" />
      Modo demostración
    </span>
  )
}

/** Enlace de sección: activo en su ruta y en las que le pertenecen (una partida es parte de Torneos). */
function EnlaceSeccion({ entrada }: { entrada: EntradaNavegacion }) {
  const { pathname } = useLocation()
  const activa = entrada.prefijos.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`))
  const { icono: Icono } = entrada
  return (
    <Link
      to={entrada.a}
      aria-current={activa ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
        activa ? 'border-oro/40 bg-oro/10 text-oro' : 'border-transparent text-texto-2 hover:bg-elevada hover:text-texto'
      }`}
    >
      <Icono aria-hidden className="size-4" />
      {entrada.etiqueta}
    </Link>
  )
}

/** Barra superior con "Entrar como", navegación lateral por rol (barra superior en móvil) y la página. */
export function Marco() {
  const { usuario } = useSesion()
  const entradas = navegacionPara(usuario.rol)

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-oro px-3 py-2 text-sm font-medium text-fondo focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>

      {/* Fija solo en escritorio: en un teléfono ocuparía un cuarto de la pantalla. */}
      <header className="border-b border-borde bg-superficie lg:sticky lg:top-0 lg:z-20">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Marca />
            <AvisoDemostracion />
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto">
            <span className="hidden text-sm text-texto-2 md:inline">{ROL[usuario.rol]}</span>
            <div className="w-full min-w-0 sm:w-auto">
              <SelectorSesion />
            </div>
          </div>
        </div>

        <nav aria-label="Secciones" className="border-t border-borde px-2 lg:hidden">
          <ul className="flex gap-1 overflow-x-auto py-2">
            {entradas.map((entrada) => (
              <li key={entrada.a} className="shrink-0">
                <EnlaceSeccion entrada={entrada} />
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Secciones" className="hidden border-r border-borde lg:block">
          <ul className="sticky top-[4.25rem] flex flex-col gap-1 p-4">
            {entradas.map((entrada) => (
              <li key={entrada.a}>
                <EnlaceSeccion entrada={entrada} />
              </li>
            ))}
          </ul>
        </nav>

        <main id="contenido" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:py-8 lg:px-8">
          {/* La llave es el usuario: al cambiar de cuenta, ningún formulario conserva lo que escribió la anterior. */}
          <div key={usuario.id} className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
