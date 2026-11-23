# Guildstrike
Guildstrike es una plataforma web de gestión de torneos de e-Sports enfocado en la trazabilidad.

# Arquitectura de la aplicación

```text
Guildstrike/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── discord.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── torneoController.js
│   │   ├── equipoController.js
│   │   ├── partidaController.js
│   │   └── disputaController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Administrador.js
│   │   ├── Arbitro.js
│   │   ├── Capitan.js
│   │   ├── Disputa.js
│   │   ├── Equipo.js
│   │   ├── EventoPartida.js
│   │   ├── Evidencia.js
│   │   ├── index.js
│   │   ├── Integrante.js
│   │   ├── Notificacion.js
│   │   ├── Partida.js
│   │   ├── ReporteResultado.js
│   │   ├── Ronda.js
│   │   ├── Torneo.js
│   │   └── Usuario.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── torneoRoutes.js
│   │   ├── equipoRoutes.js
│   │   ├── partidaRoutes.js
│   │   └── disputaRoutes.js
│   ├── services/
│   │   ├── discordService.js
│   │   └── bracketService.js
│   └── uploads/
│       └── .gitkeep
│
└── frontend/                     Vite + React + TypeScript (ver frontend/README.md)
    ├── CONTRATO-API.md            rutas, cuerpos, respuestas y errores que espera el front
    ├── README.md                  arquitectura, decisiones de diseño y cómo correrlo
    ├── index.html
    ├── public/
    └── src/
        ├── main.tsx               arma los repositorios y monta la interfaz
        ├── dominio/               tipos espejo del backend y reglas puras
        ├── aplicacion/            puertos (interfaces por agregado) y errores
        ├── infraestructura/
        │   ├── http/              cliente fetch, DTO y mapeos a dominio
        │   ├── memoria/           backend simulado con las reglas del modelo y datos semilla
        │   └── contenedor.ts      raíz de composición: elige el adaptador
        └── ui/                    proveedores, sistema visual, páginas y rutas
```

# Cómo correr el front

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, con el backend simulado en memoria
```

Desde la raíz: `npm run front:dev`, `npm run front:build` (compila a `frontend/dist`, que sirve
Express con `npm start`) y `npm run front:test`. La fuente de datos se decide al compilar: sin
variable, el front usa el backend simulado en memoria, también en el `dist` que sirve Express; con
`VITE_FUENTE_DATOS=api` llama al backend en `http://localhost:3000`, y así hay que compilarlo cuando
exista la API del contrato. Detalle en `frontend/README.md`.

# Funcionamiento
