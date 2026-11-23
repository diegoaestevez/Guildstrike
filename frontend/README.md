# Guildstrike · front

La interfaz de Guildstrike: torneos, llaves, partidas con su historial de eventos, arbitraje de
disputas y el roster de cada equipo. Funciona hoy sin backend, con un backend simulado en memoria
que aplica las mismas reglas que `backend/models`, y se conecta a la API real cambiando una
variable de entorno, sin tocar pantallas.

## Cómo correrlo

Requiere Node 20 o más reciente.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, con el backend simulado
```

Desde la raíz del repositorio también sirven `npm run front:dev`, `npm run front:build` y
`npm run front:test`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite. Las llamadas a `/api` y `/backend/uploads` se reenvían a `http://localhost:3000` |
| `npm run build` | Revisa los tipos (`tsc -b`) y compila a `frontend/dist`, que es lo que sirve Express |
| `npm test` | Pruebas con Vitest (dominio, backend simulado y adaptador HTTP) |
| `npm run lint` | oxlint, incluida la regla que hace cumplir las capas |

**Fuente de datos.** `VITE_FUENTE_DATOS` (ver `.env.example`) elige el adaptador:

- `memoria` (por defecto): backend simulado con datos semilla. Recargar la página lo reinicia.
- `api`: el servidor Express. Para usarlo, `npm run dev` en la raíz levanta el backend en `:3000`
  y `VITE_FUENTE_DATOS=api npm run dev` levanta el front apuntando a él. Las rutas que tiene que
  implementar el backend están en [`CONTRATO-API.md`](./CONTRATO-API.md).

En producción, `npm run front:build` y `npm start` en la raíz: Express sirve `frontend/dist` y
devuelve su `index.html` en cualquier ruta que no sea de la API, para que recargar
`/partidas/...` funcione.

**La fuente se decide al compilar, no al servir.** `npm run front:build` sin la variable compila con
el backend simulado en memoria: aunque Express sirva ese `dist`, el front no llama a la API. Para
servir el backend real, cuando la API del contrato exista, hay que compilar con
`VITE_FUENTE_DATOS=api npm run front:build`.

## Arquitectura

Cuatro capas. Las dependencias apuntan hacia adentro: la interfaz depende de la aplicación y del
dominio, la infraestructura implementa lo que define la aplicación, y el dominio no depende de nadie.

```
            ┌───────────────────────────────────────────────┐
            │ ui/  pantallas, componentes, rutas, sesión     │
            └──────────────┬────────────────────────────────┘
                           │ usa los puertos por contexto
            ┌──────────────▼──────────────┐      ┌──────────────────────────────┐
            │ aplicacion/  puertos.ts      │◄─────│ infraestructura/             │
            │ (interfaces) y errores       │ implementa   http/    API real     │
            └──────────────┬──────────────┘      │   memoria/ backend simulado  │
                           │                      │   contenedor.ts (elige uno)  │
            ┌──────────────▼──────────────┐      └──────────────┬───────────────┘
            │ dominio/  tipos y reglas     │◄────────────────────┘
            │ puras, sin React ni fetch    │
            └──────────────────────────────┘
   main.tsx: pide los repositorios al contenedor y se los entrega a la interfaz.
```

| Carpeta | Qué contiene |
|---|---|
| `src/dominio/` | Tipos espejo del backend (estados, roles y eventos como uniones de literales), los mensajes literales del modelo y las reglas puras: `accionesPermitidas`, ventana de evidencia, cierre de inscripciones, equipos que avanzan, campeón, roster |
| `src/aplicacion/` | `puertos.ts`: una interfaz por agregado (usuarios, torneos, partidas, disputas, equipos); toda operación de una persona recibe su `actorId`. `errores.ts`: `ErrorDeRegla` y `ErrorDeConexion`, lo único que un puerto puede lanzar |
| `src/infraestructura/http/` | Cliente `fetch` tipado (`X-Usuario-Id`, errores `{ error }` a `ErrorDeRegla`), los DTO del contrato y los mapeos DTO a dominio |
| `src/infraestructura/memoria/` | El backend simulado: almacén, los métodos del modelo portados (`reglasDelModelo.ts`), la autorización que hará la capa de rutas, las proyecciones a dominio y la semilla |
| `src/infraestructura/contenedor.ts` | Raíz de composición: el único lugar que conoce las implementaciones |
| `src/ui/` | Proveedores (React Query, repositorios y sesión), sistema visual (`tema.css`, `componentes/`, `presentacion.ts`), consultas de React Query, marco, páginas y rutas |

### La regla de capas se revisa sola

`.oxlintrc.json` tiene una regla `no-restricted-imports` por carpeta: el dominio no puede importar
React ni otra capa, la aplicación no puede importar infraestructura ni interfaz, la infraestructura
no puede importar la interfaz, y la interfaz no puede importar infraestructura. `npm run lint` falla
si alguien la rompe; se probó metiendo a propósito un import prohibido en cada capa.

Se usó oxlint porque es el linter que trae hoy la plantilla de Vite y ya implementa
`no-restricted-imports` con la misma configuración que ESLint; agregar ESLint habría sido una
segunda herramienta para lo mismo.

### Decisiones y el principio que aplica cada una

| Decisión | Principio |
|---|---|
| La interfaz depende de `puertos.ts`, no de `fetch` ni del arreglo en memoria; las implementaciones dependen de los puertos | Inversión de dependencias (DIP) |
| Un puerto por agregado en vez de un "servicio de API" con todo | Segregación de interfaces (ISP) |
| Los dos adaptadores cumplen el mismo contrato, errores incluidos: se cambian sin que una pantalla lo note | Sustitución de Liskov (LSP) |
| Un adaptador nuevo (por ejemplo, con autenticación) se agrega en `infraestructura/` y en el contenedor, sin tocar pantallas | Abierto/cerrado (OCP) |
| Cada archivo tiene una razón para cambiar: `reglasDelModelo.ts` si cambia el modelo, `proyecciones.ts` si cambia la forma de salida, `mapeos.ts` si cambia el contrato, `clienteHttp.ts` si cambia el transporte o la identidad, `presentacion.ts` si cambia cómo se nombra o pinta un estado | Responsabilidad única (SRP) |
| `main.tsx` arma los repositorios una vez y los entrega por contexto (`ui/proveedores/`) | Raíz de composición e inyección de dependencias |
| Las reglas de permisos y estados viven en funciones puras del dominio y se prueban sin React | Alta cohesión, bajo acoplamiento |
| Los mensajes literales del modelo viven en `dominio/mensajes.ts` y nada más | Una sola fuente de verdad |
| Los estados son uniones de literales y su presentación un `Record` exhaustivo: un estado nuevo no compila hasta que tenga etiqueta, color e ícono | El compilador como red |
| React Query guarda el estado del servidor; el estado de cada formulario es local al componente | Separar estado del servidor y de la interfaz |

### La sesión es de demostración

El backend no tiene autenticación, así que la barra superior trae "Entrar como" con los usuarios
semilla (administración, árbitro y un capitán por equipo). El rol decide qué se ve y qué acciones
aparecen (`accionesPermitidas` y `SoloPara`), pero eso es solo la interfaz: **la API tiene que
volver a validar cada permiso** con el `X-Usuario-Id` que recibe. Cambiar de usuario vuelve a montar
la página para que ningún formulario conserve lo que escribió la cuenta anterior.

### Las reglas de flujo de la interfaz

`accionesPermitidas` replica las guardas del modelo y agrega tres de flujo, anotadas también como
hallazgo en el contrato: solo se termina una partida en curso, no se termina dos veces y no se
reporta un marcador antes de terminarla. La pantalla de la partida guía al capitán a subir la
evidencia antes de reportar, porque cuando el segundo reporte valida la partida ya no se aceptan
evidencias.

## Datos semilla

- **Copa Relámpago Otoño 2026** (`EN_CURSO`), ronda 1 con una partida en cada estado: `AUDITADA`
  (reportes distintos y dictamen), `FINALIZADA` (los capitanes coincidieron), `CONGELADA` (disputa
  abierta sin árbitro), `EN_CURSO`, `PROGRAMADA`, y Lobos de Tlaquepaque con pase automático.
- **Liga Universitaria Invierno 2026** (`ACTIVO`) con 3 equipos: le falta uno para cerrar.
- **Brújula Negra** tiene 3 integrantes y no está inscrita: hay que completar su roster en Mi equipo
  antes de inscribirla.

Personas y equipos son ficticios. Un recorrido completo: entra como la capitana de Brújula Negra,
agrega un integrante e inscríbela en la liga; como administración, cierra inscripciones; en la Copa,
termina la partida en curso, sube evidencia y reporta con los dos capitanes; reporta marcadores
distintos en la programada; y como árbitro resuelve las disputas y genera la ronda 2.

## Sistema visual

Dos temas, oscuro y claro, con un solo acento (oro, para la acción principal y lo activo) y un color
por estado, siempre acompañado de su nombre e ícono. El botón del encabezado cambia de tema y lo
recuerda; la primera vez se usa el del sistema. El tema claro redefine los mismos tokens bajo
`data-tema="claro"`, así que ningún componente sabe en qué tema está. Los tokens están en `src/ui/tema.css` con `@theme` de
Tailwind v4, que además borra la paleta de Tailwind: solo existen los colores del sistema. Títulos en
Chakra Petch, texto en IBM Plex Sans y datos de trazabilidad (ids, marcadores, horas, eventos) en
IBM Plex Mono. El contraste se midió en el navegador, componiendo cada fondo semitransparente: de
297 textos en cinco pantallas ninguno baja de 4.5:1 (AA) y el más bajo queda en 4.75.

## Dependencias y por qué

| Paquete | Para qué |
|---|---|
| `react`, `react-dom` | La interfaz |
| `react-router` | Rutas del navegador (8.x: `createBrowserRouter` y `RouterProvider` de `react-router/dom`) |
| `@tanstack/react-query` | Estado del servidor: caché, cargas, reintentos e invalidación después de cada acción |
| `lucide-react` | Íconos |
| `@fontsource/*` | Las tres familias tipográficas, alojadas con la app (sin depender de Google Fonts) |
| `tailwindcss`, `@tailwindcss/vite` | Estilos con los tokens del sistema visual |
| `vite`, `@vitejs/plugin-react`, `typescript` | Compilación y tipos (TypeScript estricto) |
| `vitest` | Pruebas |
| `oxlint` | Lint y la regla de capas (viene con la plantilla de Vite) |
| `@types/*` | Tipos de React y Node |

El `package-lock.json` se generó con npm 11: npm 10.9 falla con `Cannot read properties of null
(reading 'edgesOut')` al resolver Vitest 5 desde cero. Con el lockfile, `npm install` y `npm ci`
funcionan también en npm 10.

## Pruebas

`npm test` corre 52 casos:

- `src/dominio/reglas.test.ts`: `accionesPermitidas` por estado y por rol, la ventana de 5 minutos,
  formato y tamaño de evidencia, cierre de inscripciones, equipos que avanzan, campeón y `validarMarcador`
  (enteros no negativos, sin empate, comparación numérica).
- `src/infraestructura/memoria/flujos.test.ts`: flujos completos contra el backend simulado: inscribir
  (y torneo no activo, equipo inválido y duplicado), cerrar con 3 y con 5 equipos (2 partidas y un pase
  automático), `iniciar` fuera de `PROGRAMADA`, marcador negativo, reportes que coinciden, reportes
  distintos, empate coincidente (rareza heredada del modelo: gana el segundo en reportar), dictamen,
  evidencia rechazada por formato, tamaño y tiempo, la ronda siguiente y el roster.
- `src/infraestructura/http/clienteHttp.test.ts`: el encabezado `X-Usuario-Id`, los errores de la API y
  las fechas ISO.

Los mensajes de las pruebas van escritos literales, copiados del backend: si alguien cambia un mensaje
en `dominio/mensajes.ts` sin cambiar el modelo, la prueba lo detecta. Antes de dar por buenas las
pruebas se rompió a propósito cada regla (dieciséis roturas, del bloqueo de `FINALIZADA` al encabezado de
identidad y la comparación del marcador) y cada una puso al menos una prueba en rojo.

## Límites conocidos

- La cuenta regresiva usa el reloj del navegador; quien decide si la evidencia llegó a tiempo es el
  servidor.
- En modo `memoria` las imágenes subidas se ven durante la sesión (URL local del navegador); las de la
  semilla no tienen imagen.
- Recargar la página reinicia el backend simulado.
