import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Punto de entrada provisional: la interfaz se arma encima del dominio y de los adaptadores.
const raiz = document.getElementById('root')
if (!raiz) {
  throw new Error('Falta el elemento #root en index.html')
}

createRoot(raiz).render(
  <StrictMode>
    <h1>Guildstrike</h1>
  </StrictMode>,
)
