// El tema vive en el atributo data-tema de <html>. El script de index.html lo pone antes de
// pintar (el guardado o, si no hay, el del sistema) para que la página no parpadee al cargar.

export type Tema = 'claro' | 'oscuro'

const CLAVE_GUARDADA = 'guildstrike.tema'

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro'
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema
  try {
    window.localStorage.setItem(CLAVE_GUARDADA, tema)
  } catch {
    // Sin almacenamiento (ventana privada): el tema dura lo que dure la pestaña.
  }
}
