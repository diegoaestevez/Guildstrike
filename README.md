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
│   │   ├── Ticket.js
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
└── frontend/
    ├── assets/
    │   ├── css/
    │   │   ├── main.css
    │   │   └── brackets.css
    │   ├── js/
    │   │   ├── api.js
    │   │   ├── utils.js
    │   │   └── ui.js
    │   └── img/
    │       └── logo.png
    ├── controllers/
    │   ├── authClientCtrl.js
    │   ├── torneoClientCtrl.js
    │   ├── partidaClientCtrl.js
    │   └── arbitroClientCtrl.js
    └── views/
        ├── index.html
        ├── login.html
        ├── dashboard_capitan.html
        ├── dashboard_arbitro.html
        ├── dashboard_admin.html
        └── brackets.html
```

# Funcionamiento
