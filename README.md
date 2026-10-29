# Guildstrike
Guildstrike es una plataforma web de gestión de torneos de e-Sports enfocado en la trazabilidad.

# Arquitectura de la aplicación

Guildstrike/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── torneoController.js
│   │   ├── equipoController.js
│   │   ├── partidaController.js
│   │   └── disputaController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Torneo.js
│   │   ├── Equipo.js
│   │   ├── Partida.js
│   │   ├── Ronda.js
│   │   ├── Evidencia.js
│   │   ├── Disputa.js
│   │   └── Notificacion.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── torneoRoutes.js
│   │   ├── equipoRoutes.js
│   │   └── partidaRoutes.js
│   ├── services/
│   │   └── discordService.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── assets/
    │   ├── css/
    │   ├── js/
    │   └── img/
    ├── controllers/
    └── views/
        ├── login.html
        ├── homepage.html
        └── brackets.html

# Funcionamiento