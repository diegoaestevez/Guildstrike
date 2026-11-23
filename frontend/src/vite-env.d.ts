/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "memoria" (por defecto) usa el backend simulado; "api" llama al servidor Express. */
  readonly VITE_FUENTE_DATOS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
