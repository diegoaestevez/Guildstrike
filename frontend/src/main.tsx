import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import './ui/tema.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { crearRepositorios } from './infraestructura/contenedor'
import { Aplicacion } from './ui/Aplicacion'

// Punto de entrada: arma los repositorios (raíz de composición) y se los entrega a la
// interfaz. Es el único archivo fuera de infraestructura/ que conoce el contenedor.
const repositorios = crearRepositorios()

const raiz = document.getElementById('root')
if (!raiz) {
  throw new Error('Falta el elemento #root en index.html')
}

createRoot(raiz).render(
  <StrictMode>
    <Aplicacion repositorios={repositorios} />
  </StrictMode>,
)
