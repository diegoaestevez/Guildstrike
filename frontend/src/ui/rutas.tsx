import { createBrowserRouter, Navigate } from 'react-router'
import { Marco } from './marco/Marco'
import { ErrorDeRuta, PaginaNoEncontrada } from './paginas/PaginaNoEncontrada'

export const enrutador = createBrowserRouter([
  {
    path: '/',
    Component: Marco,
    ErrorBoundary: ErrorDeRuta,
    children: [
      { index: true, element: <Navigate to="/torneos" replace /> },
      { path: '*', Component: PaginaNoEncontrada },
    ],
  },
])
