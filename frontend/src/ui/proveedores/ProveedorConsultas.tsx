import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ErrorDeRegla } from '../../aplicacion/errores'

function crearCliente() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        // Un rechazo de regla (404, 403) no mejora reintentando; un fallo de red, quizá sí.
        retry: (intentos, error) => !(error instanceof ErrorDeRegla) && intentos < 2,
      },
    },
  })
}

/** Estado del servidor: caché, cargas y reintentos de React Query. */
export function ProveedorConsultas({ children }: { children: ReactNode }) {
  const [cliente] = useState(crearCliente)
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
}
