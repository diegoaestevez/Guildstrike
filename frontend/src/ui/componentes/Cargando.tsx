/** Esqueleto de carga con su texto para lectores de pantalla. */
export function Cargando({ etiqueta = 'Cargando', lineas = 3 }: { etiqueta?: string; lineas?: number }) {
  return (
    <div role="status" aria-live="polite" className="w-full max-w-xl space-y-3">
      <span className="sr-only">{etiqueta}…</span>
      <div aria-hidden className="h-7 w-1/2 animate-pulse rounded-md bg-elevada" />
      {Array.from({ length: lineas }, (_, indice) => (
        <div
          aria-hidden
          key={indice}
          className="h-16 animate-pulse rounded-lg border border-borde bg-superficie"
          style={{ animationDelay: `${indice * 120}ms` }}
        />
      ))}
    </div>
  )
}
