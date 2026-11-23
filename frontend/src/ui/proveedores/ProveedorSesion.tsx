import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Cargando } from '../componentes/Cargando'
import { ErrorDeCarga } from '../componentes/ErrorDeCarga'
import { useUsuarios } from '../consultas/lecturas'
import { ContextoSesion } from './contextos'

// Sesión de demostración: el backend todavía no tiene autenticación, así que se elige
// "Entrar como" entre los usuarios. El rol decide qué se ve y qué acciones aparecen,
// pero es solo la interfaz: la API tiene que volver a validar cada permiso.

const CLAVE_GUARDADA = 'guildstrike.sesion'

function leerGuardado(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_GUARDADA)
  } catch {
    return null
  }
}

function guardar(usuarioId: string) {
  try {
    window.localStorage.setItem(CLAVE_GUARDADA, usuarioId)
  } catch {
    // Sin almacenamiento (ventana privada): la sesión dura lo que dure la pestaña.
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const consulta = useUsuarios()
  const [elegido, setElegido] = useState<string | null>(leerGuardado)

  const cuentas = useMemo(() => (consulta.data ?? []).filter((usuario) => usuario.rol !== 'INTEGRANTE'), [consulta.data])
  const usuario =
    cuentas.find((cuenta) => cuenta.id === elegido) ?? cuentas.find((cuenta) => cuenta.rol === 'ADMINISTRADOR') ?? cuentas[0]

  const entrarComo = useCallback((usuarioId: string) => {
    guardar(usuarioId)
    setElegido(usuarioId)
  }, [])

  const sesion = useMemo(() => (usuario ? { usuario, cuentas, entrarComo } : null), [usuario, cuentas, entrarComo])

  if (consulta.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <Cargando etiqueta="Cargando las cuentas de demostración" lineas={2} />
      </div>
    )
  }
  // Un refetch fallido conserva los datos: solo se cae a error si no hay cuentas que mostrar.
  if (!sesion) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <ErrorDeCarga error={consulta.error} titulo="No se pudieron cargar las cuentas" reintentar={() => void consulta.refetch()} />
      </div>
    )
  }
  return <ContextoSesion.Provider value={sesion}>{children}</ContextoSesion.Provider>
}
