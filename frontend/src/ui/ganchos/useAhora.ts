import { useEffect, useState } from 'react'

/**
 * La hora actual, refrescada cada `cadaMs`. Para cuentas regresivas y tiempos relativos.
 * La hora la decide el reloj del navegador: el servidor vuelve a revisar los límites.
 */
export function useAhora(cadaMs = 1000): Date {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), cadaMs)
    return () => window.clearInterval(intervalo)
  }, [cadaMs])
  return ahora
}
