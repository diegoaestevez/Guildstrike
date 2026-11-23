import { createBrowserRouter, Navigate } from 'react-router'
import { Marco } from './marco/Marco'
import { ErrorDeRuta, PaginaNoEncontrada } from './paginas/PaginaNoEncontrada'
import { PaginaTorneo } from './paginas/torneos/PaginaTorneo'
import { PaginaTorneos } from './paginas/torneos/PaginaTorneos'

export const enrutador = createBrowserRouter([
  {
    path: '/',
    Component: Marco,
    ErrorBoundary: ErrorDeRuta,
    children: [
      { index: true, element: <Navigate to="/torneos" replace /> },
      { path: 'torneos', Component: PaginaTorneos },
      { path: 'torneos/:torneoId', Component: PaginaTorneo },
      { path: '*', Component: PaginaNoEncontrada },
    ],
  },
])
