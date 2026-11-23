import { createBrowserRouter, Navigate } from 'react-router'
import { Marco } from './marco/Marco'
import { PaginaArbitraje } from './paginas/arbitraje/PaginaArbitraje'
import { PaginaMiEquipo } from './paginas/equipo/PaginaMiEquipo'
import { ErrorDeRuta, PaginaNoEncontrada } from './paginas/PaginaNoEncontrada'
import { PaginaPartida } from './paginas/partida/PaginaPartida'
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
      { path: 'partidas/:partidaId', Component: PaginaPartida },
      { path: 'arbitraje', Component: PaginaArbitraje },
      { path: 'arbitraje/:partidaId', Component: PaginaArbitraje },
      { path: 'mi-equipo', Component: PaginaMiEquipo },
      { path: '*', Component: PaginaNoEncontrada },
    ],
  },
])
