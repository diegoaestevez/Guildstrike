// Casos de verificación de la Entrega 2 (tabla de la sección 4 del documento).
// Se corren antes de refactorizar (v1-antes) y después de cada refactorización:
// si un resultado cambia, la refactorización alteró el comportamiento.
// Uso: node backend/pruebas/verificacion.js

const Torneo = require('../models/Torneo');
const Partida = require('../models/Partida');
const Equipo = require('../models/Equipo');
const Capitan = require('../models/Capitan');
const Integrante = require('../models/Integrante');
const Arbitro = require('../models/Arbitro');
const Administrador = require('../models/Administrador');
const Notificacion = require('../models/Notificacion');

// En v1-antes todavía no existe NotificadorDiscord (llega con R-01): ahí la
// notificación recibe el webhook directo, después lo recibe NotificadorDiscord.
let NotificadorDiscord = null;
try {
  NotificadorDiscord = require('../services/NotificadorDiscord');
} catch (error) {
  NotificadorDiscord = null;
}
const canalDeAvisos = (webhook) => (NotificadorDiscord ? new NotificadorDiscord(webhook) : webhook);

// En v1-antes el torneo de eliminación simple es Torneo; desde R-02 es la subclase
// TorneoEliminacionSimple. Solo se ignora que el archivo no exista, cualquier otro error truena.
let TorneoDeLaPrueba = Torneo;
try {
  TorneoDeLaPrueba = require('../models/TorneoEliminacionSimple');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const resultados = [];

function caso(id, rf, tipo, prueba) {
  let resultado = 'No cumple';
  let detalle = '';
  try {
    if (prueba() === true) {
      resultado = 'Cumple';
    }
  } catch (error) {
    detalle = error.message;
  }
  resultados.push({ id, rf, tipo, resultado, detalle });
}

function lanzaError(funcion, texto) {
  try {
    funcion();
  } catch (error) {
    return error.message.includes(texto);
  }
  return false;
}

let consecutivo = 0;
function crearEquipo(nombre, integrantes = 4) {
  consecutivo += 1;
  const capitan = new Capitan(`cap-${consecutivo}`, `Capitán ${nombre}`, `cap${consecutivo}@correo.mx`);
  const equipo = new Equipo(`eq-${consecutivo}`, nombre, capitan);
  for (let i = 1; i <= integrantes; i += 1) {
    equipo.agregarIntegrante(new Integrante(`int-${consecutivo}-${i}`, `${nombre} ${i}`, `int${consecutivo}${i}@correo.mx`));
  }
  return equipo;
}

function partidaEnCurso() {
  const alpha = crearEquipo('Alpha');
  const bravo = crearEquipo('Bravo');
  const partida = new Partida('1-1', alpha, bravo, new Date('2026-11-20T18:00:00'));
  partida.iniciar();
  return { partida, alpha, bravo };
}

const MB = 1024 * 1024;
const FIN = new Date('2026-11-20T19:00:00');
const minutosDespues = (minutos) => new Date(FIN.getTime() + minutos * 60000);
function captura(equipo, tipo, minutos) {
  return { equipo, nombre: 'captura', tipo, tamanoBytes: MB, fechaCarga: minutosDespues(minutos) };
}

// RF-01: el capitán inscribe a su equipo en un torneo activo.
caso('V-01a', 'RF-01', 'Correcto', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  torneo.inscribirEquipo(crearEquipo('Alpha', 4));
  return torneo.equipos.length === 1;
});
caso('V-01b', 'RF-01', 'Error', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  const rechazada = lanzaError(() => torneo.inscribirEquipo(crearEquipo('Alpha', 3)), 'debe tener entre 4 y 9 integrantes');
  return rechazada && torneo.equipos.length === 0;
});

// RF-02: al cerrar inscripciones se genera la estructura de llaves.
caso('V-02a', 'RF-02', 'Correcto', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  ['A', 'B', 'C', 'D'].forEach((nombre) => torneo.inscribirEquipo(crearEquipo(nombre)));
  const ronda = torneo.cerrarInscripciones();
  return torneo.estado === 'EN_CURSO' && ronda.numero === 1 && ronda.partidas.length === 2;
});
caso('V-02b', 'RF-02', 'Error', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  ['A', 'B', 'C'].forEach((nombre) => torneo.inscribirEquipo(crearEquipo(nombre)));
  const rechazado = lanzaError(() => torneo.cerrarInscripciones(), 'Se requieren al menos 4 equipos');
  return rechazado && torneo.estado === 'ACTIVO';
});

// RF-03: se programa el horario y el rival de cada partida.
caso('V-03a', 'RF-03', 'Correcto', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((nombre) => crearEquipo(nombre));
  [a, b, c, d].forEach((equipo) => torneo.inscribirEquipo(equipo));
  const [p1, p2] = torneo.cerrarInscripciones().partidas;
  const conFecha = (p) => p.fechaProgramada instanceof Date && !Number.isNaN(p.fechaProgramada.getTime());
  return p1.equipos[0] === a && p1.equipos[1] === b && p2.equipos[0] === c && p2.equipos[1] === d
    && conFecha(p1) && conFecha(p2);
});
caso('V-03b', 'RF-03', 'Error', () => {
  const torneo = new TorneoDeLaPrueba('t1', 'Copa ITESO');
  const equipos = ['A', 'B', 'C', 'D', 'E'].map((nombre) => crearEquipo(nombre));
  equipos.forEach((equipo) => torneo.inscribirEquipo(equipo));
  const ronda = torneo.cerrarInscripciones();
  return ronda.partidas.length === 2 && ronda.paseAutomatico === equipos[4];
});

// RF-04: el capitán sube la evidencia al finalizar la partida.
caso('V-04a', 'RF-04', 'Correcto', () => {
  const { partida, alpha } = partidaEnCurso();
  partida.finalizarJuego(FIN);
  partida.agregarEvidencia(alpha.capitan, captura(alpha, 'image/png', 2));
  return partida.evidencias.length === 1;
});
caso('V-04b', 'RF-04', 'Error', () => {
  const { partida, alpha } = partidaEnCurso();
  partida.finalizarJuego(FIN);
  const rechazada = lanzaError(() => partida.agregarEvidencia(alpha.capitan, captura(alpha, 'image/gif', 2)), 'debe ser PNG o JPG');
  return rechazada && partida.evidencias.length === 0;
});
caso('V-04c', 'RF-04', 'Correcto', () => {
  const admin = new Administrador('adm-1', 'Admin', 'admin@correo.mx');
  admin.actualizarConfiguracion({ limiteEvidenciaMinutos: 10 });
  const { partida, alpha } = partidaEnCurso();
  partida.finalizarJuego(FIN);
  partida.agregarEvidencia(alpha.capitan, captura(alpha, 'image/png', 8), admin.configuracion);
  const enBitacora = admin.consultarBitacora().some((registro) => registro.tipo === 'CONFIGURACION_ACTUALIZADA');
  return partida.evidencias.length === 1 && enBitacora;
});
caso('V-04d', 'RF-04', 'Error', () => {
  const { partida, alpha } = partidaEnCurso();
  partida.finalizarJuego(FIN);
  const rechazada = lanzaError(() => partida.agregarEvidencia(alpha.capitan, captura(alpha, 'image/png', 8)), 'fuera del tiempo límite');
  return rechazada && partida.evidencias.length === 0;
});

// RF-05: el sistema valida el marcador si ambos capitanes coinciden.
caso('V-05a', 'RF-05', 'Correcto', () => {
  const { partida, alpha, bravo } = partidaEnCurso();
  partida.registrarResultado(alpha.capitan, 2, 1);
  partida.registrarResultado(bravo.capitan, 1, 2);
  return partida.estado === 'FINALIZADA' && partida.ganador === alpha;
});
caso('V-05b', 'RF-05', 'Error', () => {
  const { partida, alpha, bravo } = partidaEnCurso();
  partida.registrarResultado(alpha.capitan, 2, 1);
  partida.registrarResultado(bravo.capitan, 2, 1);
  return partida.estado === 'CONGELADA' && partida.disputa !== null;
});

// RF-06: el capitán reporta un error en el marcador e inicia una disputa.
caso('V-06a', 'RF-06', 'Correcto', () => {
  const { partida, alpha } = partidaEnCurso();
  const disputa = partida.abrirDisputa(alpha.capitan, 'El rival reportó mal el marcador');
  return partida.estado === 'CONGELADA' && disputa.estado === 'ABIERTO';
});
caso('V-06b', 'RF-06', 'Error', () => {
  const { partida, alpha, bravo } = partidaEnCurso();
  partida.registrarResultado(alpha.capitan, 2, 1);
  partida.registrarResultado(bravo.capitan, 1, 2);
  const denegada = lanzaError(() => partida.abrirDisputa(alpha.capitan, 'Inconformidad'), 'no admite más cambios');
  return denegada && partida.disputa === null && partida.estado === 'FINALIZADA';
});

// RF-07: el árbitro revisa la disputa y emite un dictamen.
caso('V-07a', 'RF-07', 'Correcto', () => {
  const { partida, alpha, bravo } = partidaEnCurso();
  const disputa = partida.abrirDisputa(alpha.capitan, 'Inconformidad');
  const arbitro = new Arbitro('arb-1', 'Árbitro', 'arbitro@correo.mx');
  arbitro.asignarDisputa(disputa);
  disputa.resolver(arbitro, bravo, 'La evidencia muestra que ganó Bravo');
  return disputa.estado === 'RESUELTO' && partida.estado === 'AUDITADA' && partida.ganador === bravo;
});
caso('V-07b', 'RF-07', 'Error', () => {
  const { partida, alpha } = partidaEnCurso();
  const disputa = partida.abrirDisputa(alpha.capitan, 'Inconformidad');
  const arbitro = new Arbitro('arb-1', 'Árbitro', 'arbitro@correo.mx');
  arbitro.asignarDisputa(disputa);
  const bloqueado = lanzaError(() => disputa.resolver(arbitro, null, 'Sin ganador'), 'El ganador debe participar');
  return bloqueado && disputa.estado === 'ABIERTO' && partida.estado === 'CONGELADA';
});

// RF-08: el sistema envía una notificación al programar una partida.
function webhookDePrueba({ responde = true } = {}) {
  return {
    recibidos: [],
    responde,
    send(mensaje) {
      if (!this.responde) {
        throw new Error('Sin respuesta');
      }
      this.recibidos.push(mensaje);
      return true;
    }
  };
}
caso('V-08a', 'RF-08', 'Correcto', () => {
  const webhook = webhookDePrueba();
  const aviso = new Notificacion(canalDeAvisos(webhook), ['Alpha', 'Bravo'], 'PARTIDA_PROGRAMADA', 'Partida el 20/11 a las 18:00');
  aviso.enviarWebhook();
  return aviso.estado === 'ENVIADA' && webhook.recibidos.length === 1 && aviso.intentos === 1;
});
caso('V-08b', 'RF-08', 'Error', () => {
  const webhook = webhookDePrueba({ responde: false });
  const aviso = new Notificacion(canalDeAvisos(webhook), ['Alpha', 'Bravo'], 'PARTIDA_PROGRAMADA', 'Partida el 20/11 a las 18:00');
  const fallo = lanzaError(() => aviso.enviarWebhook(), 'Sin respuesta');
  const guardoElFallo = fallo && aviso.estado === 'FALLIDA' && aviso.fallos.length === 1;
  webhook.responde = true;
  aviso.reintentarEnvio();
  return guardoElFallo && aviso.estado === 'ENVIADA' && aviso.intentos === 2;
});

// RF-14: el usuario ve los brackets con el nombre de cada equipo.
caso('V-14a', 'RF-14', 'Correcto', () => crearEquipo('Alpha', 4).obtenerEtiquetaBracket() === 'Alpha (4 integrantes)');

// RF-15: el sistema conserva el historial de eventos de cada partida.
caso('V-15a', 'RF-15', 'Correcto', () => {
  const { partida, alpha, bravo } = partidaEnCurso();
  partida.registrarResultado(alpha.capitan, 2, 1);
  partida.registrarResultado(bravo.capitan, 2, 1);
  const arbitro = new Arbitro('arb-1', 'Árbitro', 'arbitro@correo.mx');
  arbitro.asignarDisputa(partida.disputa);
  partida.disputa.resolver(arbitro, bravo, 'La evidencia muestra que ganó Bravo');
  const tipos = partida.eventos.map((evento) => evento.tipo);
  const esperados = ['PARTIDA_INICIADA', 'RESULTADO_REPORTADO', 'RESULTADO_REPORTADO', 'DISPUTA_ABIERTA', 'DICTAMEN_EMITIDO'];
  return JSON.stringify(tipos) === JSON.stringify(esperados)
    && partida.eventos.every((evento) => evento.fecha instanceof Date);
});

console.table(resultados.map(({ id, rf, tipo, resultado, detalle }) => (detalle ? { id, rf, tipo, resultado, detalle } : { id, rf, tipo, resultado })));
const fallidos = resultados.filter((r) => r.resultado !== 'Cumple').length;
console.log(`${resultados.length - fallidos} de ${resultados.length} casos cumplen`);
process.exitCode = fallidos ? 1 : 0;
