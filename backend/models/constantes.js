// Roles y estados que se usan en todo el sistema

const RolUsuario = Object.freeze({
  CAPITAN: 'CAPITAN',
  ARBITRO: 'ARBITRO',
  ADMINISTRADOR: 'ADMINISTRADOR',
});

const EstadoTorneo = Object.freeze({
  BORRADOR: 'BORRADOR', // todavía no acepta equipos
  INSCRIPCIONES: 'INSCRIPCIONES', // inscripciones abiertas
  EN_CURSO: 'EN_CURSO', // ya se generaron las llaves
  SUSPENDIDO: 'SUSPENDIDO', // no llegó al mínimo de equipos (RF-02)
  FINALIZADO: 'FINALIZADO', // ya hay campeón
});

const EstadoPartida = Object.freeze({
  PENDIENTE: 'PENDIENTE', // creada pero sin horario
  PROGRAMADA: 'PROGRAMADA', // con horario asignado
  ESPERANDO_RESULTADOS: 'ESPERANDO_RESULTADOS', // ya se jugó, corre el tiempo de evidencias
  EN_DISPUTA: 'EN_DISPUTA', // congelada (RN-04)
  FINALIZADA: 'FINALIZADA', // ambos capitanes coincidieron
  AUDITADA: 'AUDITADA', // resuelta por dictamen del árbitro
});

const EstadoDisputa = Object.freeze({
  ABIERTA: 'ABIERTA',
  EN_REVISION: 'EN_REVISION',
  RESUELTA: 'RESUELTA',
});

const EstadoEnvio = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ENVIADO: 'ENVIADO',
  FALLIDO: 'FALLIDO',
});

module.exports = { RolUsuario, EstadoTorneo, EstadoPartida, EstadoDisputa, EstadoEnvio };
