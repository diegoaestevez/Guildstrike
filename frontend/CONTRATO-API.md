# Contrato de la API de Guildstrike

Lo que el front espera del backend, ruta por ruta. El adaptador `src/infraestructura/http/` lo
consume tal cual, y el adaptador en memoria (`src/infraestructura/memoria/`) lo simula con las
mismas reglas: si el backend implementa este documento, el front cambia de fuente con
`VITE_FUENTE_DATOS=api` y ninguna pantalla se toca.

Las formas exactas de cada respuesta están en `src/infraestructura/http/dto.ts`; este documento
las resume.

## Convenciones

- **Base**: todas las rutas empiezan con `/api` y hablan JSON (`Content-Type: application/json`),
  salvo la carga de evidencia, que es `multipart/form-data`.
- **Quién actúa**: toda escritura (`POST`) trae el encabezado `X-Usuario-Id` con el id del usuario
  que la hace. Hoy no hay autenticación; cuando la haya, se cambia el encabezado por el token y en
  el front solo cambia `encabezadosDeIdentidad()` en `clienteHttp.ts`.
- **Permisos**: el rol que se ve en la interfaz es solo para decidir qué mostrar. **La API tiene que
  volver a validar cada permiso** con el usuario de `X-Usuario-Id`.
- **Fechas**: texto ISO 8601 en UTC (`"2026-11-20T18:42:13.000Z"`), lo que da `Date.toJSON()`.
- **Ids**: texto. Los ids de partida tienen que ser únicos entre torneos (ver "Notas para el
  backend", punto 2); el front usa `<torneoId>-<ronda>-<número>`.
- **Referencias**: los DTO llevan ids y, cuando la pantalla necesita el nombre, una referencia
  `{ "id", "nombre" }`. Nunca objetos del modelo con referencias circulares
  (`partida.disputa.partida`, `equipo.capitan.equipo`).
- **Escrituras**: responden `200` con el agregado completo ya actualizado (el torneo, la partida o
  el equipo), con la misma forma que su `GET`.
- **Errores**: `4xx` con cuerpo `{ "error": "<mensaje>" }`. El front muestra el mensaje tal cual al
  lado de la acción, así que debe ser el texto literal del modelo.

| Código | Cuándo | Mensaje |
|---|---|---|
| `400` | El modelo rechazó la operación (`throw new Error(...)`) | El de la excepción, literal |
| `401` | Una escritura llegó sin `X-Usuario-Id` | `Falta identificar al usuario` |
| `403` | El usuario no tiene el rol o no es parte de la partida o del equipo | `No tienes permiso para esta acción` |
| `404` | No existe el recurso de la ruta | `El torneo no existe`, `La partida no existe`, `El equipo no existe`, `El usuario no existe`, `La partida no tiene disputa` |
| `5xx` | Cualquier otra falla | Libre; el front dice que no pudo conectar |

## Formas (DTO)

```ts
Referencia     { id, nombre }
Usuario        { id, nombre, correo, rol: 'ADMINISTRADOR'|'CAPITAN'|'ARBITRO'|'INTEGRANTE', equipo: Referencia|null }
Equipo         { id, nombre, capitan: Referencia, integrantes: [{ id, nombre, correo }] }   // el capitán no va en integrantes
TorneoResumen  { id, nombre, estado: 'ACTIVO'|'EN_CURSO', formato: 'ELIMINACION_SIMPLE', equiposInscritos, rondaActual: number|null }
Torneo         { id, nombre, estado, formato, equipos: [EquipoInscrito], rondas: [Ronda] }
EquipoInscrito { id, nombre, capitanId, totalIntegrantes }
Ronda          { numero, partidas: [PartidaResumen], paseAutomatico: Referencia|null }
PartidaResumen { id, torneoId, ronda, equipos: [Referencia, Referencia], estado, fechaProgramada, fechaFin|null,
                 ganadorId|null, marcador: { equipoA, equipoB }|null }
Partida        PartidaResumen + { torneoNombre, reportes: [Reporte], evidencias: [Evidencia], disputa: Disputa|null, eventos: [Evento] }
Reporte        { equipoId, capitanId, marcadorPropio, marcadorRival, fecha }
Evidencia      { equipoId, nombre, tipo, tamanoBytes, fechaCarga, url|null }          // url: /backend/uploads/<archivo>
Disputa        { solicitante: Referencia, motivo, estado: 'ABIERTO'|'RESUELTO', arbitro: Referencia|null,
                 equipoGanadorId|null, justificacion|null, fechaCreacion, fechaResolucion|null }
Evento         { tipo, usuario: Referencia|null, descripcion, fecha }                 // usuario null = el sistema
DisputaResumen { partidaId, torneoId, torneoNombre, ronda, equipos: [Referencia, Referencia], motivo,
                 solicitante: Referencia, arbitro: Referencia|null, estado, fechaCreacion }
```

- `estado` de partida: `PROGRAMADA`, `EN_CURSO`, `FINALIZADA`, `CONGELADA`, `AUDITADA`.
- `tipo` de evento: `PARTIDA_INICIADA`, `RESULTADO_REPORTADO`, `RESULTADO_VALIDADO`,
  `EVIDENCIA_AGREGADA`, `DISPUTA_ABIERTA`, `DICTAMEN_EMITIDO`. Los eventos van en el orden en que
  ocurrieron (RF-15).
- `marcador`: solo cuando la partida está `FINALIZADA` porque los dos reportes coincidieron (RF-05),
  en el orden de `equipos`. Una partida `AUDITADA` tiene `ganadorId` y `marcador: null`.
- `equipo` del usuario: el que representa (capitán) o al que pertenece (integrante); `null` para
  administrador y árbitro.

## Rutas

Cada fila de errores está en el orden en que el modelo revisa; ese orden importa, porque el
mensaje que ve el usuario es el de la primera regla que falla.

### Usuarios

**`GET /api/usuarios`** → `200 [Usuario]`. Todos los usuarios; el selector "Entrar como" muestra
los que no son integrantes.

### Torneos

**`GET /api/torneos`** → `200 [TorneoResumen]`.

**`GET /api/torneos/:id`** → `200 Torneo` con sus equipos inscritos en orden de inscripción y sus
rondas con partidas resumidas y pase automático (RF-14). `404 El torneo no existe`.

**`POST /api/torneos/:id/equipos`** (RF-01) · cuerpo `{ "equipoId": "eq-1" }` → `200 Torneo`.
Quién: el capitán de ese equipo (`403` si no). Modelo: `Torneo.inscribirEquipo`.

| Código | Mensaje |
|---|---|
| 400 | `El torneo no acepta inscripciones` |
| 400 | `El equipo debe tener entre 4 y 9 integrantes` |
| 400 | `El equipo ya está inscrito` |
| 404 | `El torneo no existe`, `El equipo no existe` |

**`POST /api/torneos/:id/cerrar-inscripciones`** (RF-02) · sin cuerpo → `200 Torneo` ya
`EN_CURSO`, con la ronda 1. Quién: administrador. Modelo: `Torneo.cerrarInscripciones`.

| Código | Mensaje |
|---|---|
| 400 | `El torneo ya no está activo` |
| 400 | `Se requieren al menos 4 equipos` |

**`POST /api/torneos/:id/rondas`** · sin cuerpo → `200 Torneo` con la ronda nueva. Quién:
administrador. Pasan a la ronda nueva **los ganadores de la anterior y su pase automático** (el pase
primero, para que no vuelva a quedar impar dos veces seguidas), no todos los inscritos.

| Código | Mensaje |
|---|---|
| 400 | `El torneo todavía no tiene rondas: primero hay que cerrar inscripciones` |
| 400 | `La ronda anterior aún no está completa` (el del modelo) |
| 400 | `El torneo ya tiene campeón` |

### Partidas

**`GET /api/partidas/:id`** → `200 Partida` con reportes, evidencias, disputa y eventos.
`404 La partida no existe`.

**`POST /api/partidas/:id/iniciar`** · sin cuerpo → `200 Partida` en `EN_CURSO`. Quién:
administrador. `400 Se esperaba estado PROGRAMADA`.

**`POST /api/partidas/:id/finalizar`** · sin cuerpo → `200 Partida` con `fechaFin`, que abre la
ventana de evidencia de 5 minutos. Quién: administrador o un capitán de la partida.
`400 La partida no puede finalizarse en su estado actual`. Ver puntos 4 y 5 de las notas.

**`POST /api/partidas/:id/reportes`** (RF-05) · cuerpo `{ "marcadorPropio": 2, "marcadorRival": 1 }`
→ `200 Partida`. Quién: un capitán (el modelo revisa que su equipo juegue). Con el segundo reporte,
si coinciden la partida queda `FINALIZADA` con ganador; si no, `CONGELADA` con una disputa abierta
por `Marcadores discrepantes`.

| Código | Mensaje |
|---|---|
| 400 | `La partida no admite más cambios` |
| 400 | `El capitán no participa en esta partida` |
| 400 | `El equipo ya reportó un resultado` |
| 400 | `El reporte de resultado es inválido` (enteros de 0 en adelante) |

**`POST /api/partidas/:id/evidencias`** (RF-04) · `multipart/form-data` con el campo `archivo`
(PNG o JPG, 5 MB como máximo) → `200 Partida`. Quién: un capitán de la partida. El servidor toma
`nombre`, `tipo` y `tamanoBytes` del archivo recibido, `fechaCarga` de su reloj, lo guarda en
`backend/uploads/` y lo expone en `url`.

| Código | Mensaje |
|---|---|
| 400 | `La partida no admite más cambios` |
| 400 | `La evidencia sólo se recibe al finalizar la partida` |
| 400 | `La evidencia debe asociarse al equipo del capitán` |
| 400 | `Los metadatos de evidencia son inválidos` |
| 400 | `La evidencia debe ser PNG o JPG` |
| 400 | `La evidencia excede el tamaño máximo permitido` |
| 400 | `La evidencia está fuera del tiempo límite` |

### Disputas

La disputa no tiene id en el modelo: hay a lo sumo una por partida, así que sus rutas cuelgan de
la partida.

**`POST /api/partidas/:id/disputa`** (RF-06) · cuerpo `{ "motivo": "..." }` → `200 Partida` en
`CONGELADA`. Quién: un capitán (el modelo revisa que su equipo juegue).

| Código | Mensaje |
|---|---|
| 400 | `La partida no admite más cambios` |
| 400 | `El solicitante no participa en la partida` |
| 400 | `La partida ya tiene una disputa` |
| 400 | `Partida, solicitante y motivo son obligatorios` |

**`GET /api/disputas?estado=ABIERTO`** → `200 [DisputaResumen]`, de la más antigua a la más
reciente. Sin `estado`, todas.

**`POST /api/partidas/:id/disputa/arbitro`** · sin cuerpo → `200 Partida`. El árbitro toma el ticket
(`Arbitro.asignarDisputa`). Quién: árbitro. `404 La partida no tiene disputa`,
`400 El ticket ya no está disponible`.

**`POST /api/partidas/:id/disputa/dictamen`** (RF-07) · cuerpo
`{ "equipoGanadorId": "eq-2", "justificacion": "..." }` → `200 Partida` en `AUDITADA`. Quién: el
árbitro que tomó la disputa.

| Código | Mensaje |
|---|---|
| 404 | `La partida no tiene disputa` |
| 400 | `El ticket no puede resolverse con esos datos` (no está abierta, la tomó otro árbitro o falta la justificación) |
| 400 | `El ganador debe participar en la partida` |

### Equipos

**`GET /api/equipos/:id`** → `200 Equipo`. `404 El equipo no existe`.

**`POST /api/equipos/:id/integrantes`** · cuerpo `{ "nombre": "...", "correo": "..." }` →
`200 Equipo`. Quién: el capitán de ese equipo. El correo identifica a la persona: si ya existe un
integrante con ese correo se reutiliza, y así aplican las reglas de duplicado y de otro equipo.

| Código | Mensaje |
|---|---|
| 400 | `id, nombre y correo son obligatorios` |
| 400 | `El usuario ya está registrado` (el correo es de una cuenta que no es de integrante) |
| 400 | `El roster no puede exceder 9 integrantes` |
| 400 | `El integrante ya pertenece al equipo` |
| 400 | `El integrante ya pertenece a otro equipo` |

## Notas para el backend

Lo que apareció al construir el front contra `backend/models`. El adaptador en memoria replica el
modelo tal cual salvo donde se dice.

1. **La ronda siguiente vuelve a emparejar a todos.** `Torneo.generarRonda` llama a
   `armarEmparejamientos(ronda, this.equipos.slice())`: la ronda 2 juega con todos los inscritos,
   no con los ganadores. El adaptador en memoria hace avanzar a los ganadores más el pase
   automático (`equiposQueAvanzan` en `src/dominio/torneo.ts`). Además `generarRonda` no revisa que
   ya se hayan cerrado inscripciones ni que haya campeón, y el torneo no tiene un estado final.
2. **Ids de partida repetidos.** `Ronda.agregarPartida` usa `${numero}-${n}`: la partida `1-1` existe
   en cada torneo, y `/api/partidas/:id` necesita un id único.
3. **Validar cierra la evidencia.** Cuando el segundo reporte coincide, la partida pasa a
   `FINALIZADA` y `_exigirNoCongelada` ya no acepta evidencias, aunque la ventana de 5 minutos siga
   abierta. Si un capitán reporta antes de subir su captura, se queda sin evidencia. La pantalla lo
   advierte; en el modelo se podría aceptar evidencia en `FINALIZADA` dentro de la ventana.
4. **`finalizarJuego` se puede llamar dos veces** y cada vez mueve `fechaFin`, lo que reabre la
   ventana de evidencia. También acepta una partida `PROGRAMADA`, que termina sin haber tenido
   `PARTIDA_INICIADA`. La interfaz solo ofrece terminar una partida `EN_CURSO` sin `fechaFin`.
5. **Terminar no deja evento.** No existe `PARTIDA_FINALIZADA`: la hora de fin no aparece en el
   historial, solo en `fechaFin`. Tampoco deja evento tomar una disputa, y `PARTIDA_INICIADA` se
   registra con usuario `null` aunque la inicie un administrador.
6. **Empate.** Si los dos capitanes reportan 2-2, los reportes coinciden y `_validarReportes` le da
   la victoria al segundo en reportar (`2 > 2` es falso). El formulario del front no acepta empates.
7. **Evidencia de un equipo ajeno.** `agregarEvidencia` compara el equipo del capitán con el que trae
   `datos`, que arma quien llama, pero no revisa que ese equipo juegue la partida. Con un usuario sin
   equipo, `undefined !== undefined` es falso y la evidencia entra sin equipo. La ruta tiene que
   revisar que sea capitán de uno de los dos equipos.
8. **Ticket reasignable.** `Disputa.asignarArbitro` solo revisa que esté `ABIERTO`: un segundo árbitro
   puede quitarle el ticket al primero. La interfaz no lo ofrece.
9. **Roles.** El modelo no revisa quién inicia, termina, cierra inscripciones, genera rondas o inscribe
   a un equipo; eso le toca a la capa de rutas, con `403`.
10. **Horario (RF-03).** `TorneoEliminacionSimple` programa todas las partidas con `new Date()`, el
    momento en que se genera la ronda; no hay forma de fijar el horario de cada una.
