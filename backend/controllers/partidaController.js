const { db, buscarPorId } = require('../config/db');
const Evidencia = require('../models/Evidencia');
const Disputa = require('../models/Disputa');
const Notificacion = require('../models/Notificacion');
const { RolUsuario, EstadoPartida } = require('../models/constantes');
const AppError = require('../utils/AppError');

const MINUTOS_RECORDATORIO = 15; // RF-11

function nombreDePartida(partida) {
  const e1 = db.equipos.find((e) => e.id === partida.equipo1Id);
  const e2 = db.equipos.find((e) => e.id === partida.equipo2Id);
  return `${e1?.nombre ?? partida.equipo1Id} vs ${e2?.nombre ?? partida.equipo2Id}`;
}

function tiempoLimite(partida) {
  return buscarPorId('torneos', partida.torneoId, 'Torneo').tiempoLimiteEvidencia;
}

// El capitán solo puede actuar sobre partidas de su equipo
function obtenerPartidaDelCapitan(req) {
  const partida = buscarPorId('partidas', req.params.id, 'Partida');
  if (!req.usuario.tieneEquipo() || !partida.incluyeEquipo(req.usuario.equipoId)) {
    throw new AppError('Tu equipo no juega esta partida', 403);
  }
  return partida;
}

// GET /api/partidas?torneoId=1&estado=PROGRAMADA
function listar(req, res) {
  const { torneoId, estado } = req.query;
  let partidas = db.partidas;
  if (torneoId) partidas = partidas.filter((p) => p.torneoId === Number(torneoId));
  if (estado) partidas = partidas.filter((p) => p.estado === estado);
  res.json(partidas.map(({ historial, ...p }) => p));
}

// GET /api/partidas/:id -> RF-15: expediente completo
function obtener(req, res) {
  const partida = buscarPorId('partidas', req.params.id, 'Partida');
  const esStaff = req.usuario.rol === RolUsuario.ARBITRO || req.usuario.rol === RolUsuario.ADMINISTRADOR;
  const juegaLaPartida = req.usuario.rol === RolUsuario.CAPITAN && partida.incluyeEquipo(req.usuario.equipoId);
  if (!esStaff && !juegaLaPartida) throw new AppError('No tienes permiso para ver esta partida', 403);

  const disputa = partida.disputaId ? db.disputas.find((d) => d.id === partida.disputaId) : null;
  res.json({ ...partida, disputa });
}

// PATCH /api/partidas/:id/horario (árbitro) -> RF-03, RF-10 y aviso RF-08
async function programarHorario(req, res) {
  const partida = buscarPorId('partidas', req.params.id, 'Partida');
  const reprogramada = partida.fechaHora !== null;
  partida.programarHorario(req.body.fechaHora, req.usuario.id);

  const aviso = await Notificacion.enviar({
    tipo: reprogramada ? 'PARTIDA_REPROGRAMADA' : 'PARTIDA_PROGRAMADA',
    mensaje: `Ronda ${partida.ronda}. Horario: ${partida.fechaHora.toISOString()}`,
    destinatario: nombreDePartida(partida),
    partidaId: partida.id,
  });
  res.json({ partida, estadoAviso: aviso.estadoEntrega });
}

// PATCH /api/partidas/:id/terminar (árbitro)
function terminar(req, res) {
  const partida = buscarPorId('partidas', req.params.id, 'Partida');
  partida.terminar(req.usuario.id);
  res.json({ partida, limiteEvidencia: partida.obtenerLimiteEvidencia(tiempoLimite(partida)) });
}

// POST /api/partidas/:id/evidencias (capitán) -> RF-04
function subirEvidencia(req, res) {
  const partida = obtenerPartidaDelCapitan(req);
  // Pendiente: cuando exista uploadMiddleware, sacar ruta/formato/tamaño de req.file
  const evidencia = new Evidencia({ ...req.body, subidaPor: req.usuario.id, equipoId: req.usuario.equipoId });
  evidencia.asociarAPartida(partida, tiempoLimite(partida));
  res.status(201).json(evidencia);
}

// POST /api/partidas/:id/marcador (capitán) -> RF-05
async function reportarMarcador(req, res) {
  const partida = obtenerPartidaDelCapitan(req);
  const { marcadorEquipo1, marcadorEquipo2 } = req.body;
  partida.reportarMarcador(req.usuario.equipoId, marcadorEquipo1, marcadorEquipo2, req.usuario.id, tiempoLimite(partida));

  const resultado = partida.validarMarcador();
  if (resultado === null) {
    return res.json({ mensaje: 'Marcador registrado, esperando el reporte del rival', partida });
  }
  if (resultado === true) {
    return res.json({ mensaje: 'Los marcadores coinciden, partida finalizada', partida });
  }

  // No coinciden -> disputa automática
  const disputa = Disputa.abrirTicket(partida, null, 'Los marcadores reportados por ambos capitanes no coinciden');
  db.disputas.push(disputa);
  await Notificacion.enviar({
    tipo: 'DISPUTA_ABIERTA',
    mensaje: 'Marcadores distintos, un árbitro revisará la partida',
    destinatario: nombreDePartida(partida),
    partidaId: partida.id,
  });
  res.status(409).json({ mensaje: 'Los marcadores no coinciden, se abrió una disputa', disputa });
}

// POST /api/partidas/:id/disputa (capitán) -> RF-06
async function abrirDisputa(req, res) {
  const partida = obtenerPartidaDelCapitan(req);
  const disputa = Disputa.abrirTicket(partida, req.usuario.id, req.body.motivo);
  db.disputas.push(disputa);
  await Notificacion.enviar({
    tipo: 'DISPUTA_ABIERTA',
    mensaje: `Motivo: ${disputa.motivo}`,
    destinatario: nombreDePartida(partida),
    partidaId: partida.id,
  });
  res.status(201).json(disputa);
}

// RF-11: no es endpoint, se llama cada minuto desde server.js
async function enviarRecordatorios() {
  const ahora = Date.now();
  const proximas = db.partidas.filter((p) => p.estado === EstadoPartida.PROGRAMADA
    && !p.recordatorioEnviado
    && p.fechaHora.getTime() > ahora
    && p.fechaHora.getTime() - ahora <= MINUTOS_RECORDATORIO * 60 * 1000);

  for (const partida of proximas) {
    partida.recordatorioEnviado = true;
    await Notificacion.enviar({
      tipo: 'RECORDATORIO',
      mensaje: `Su partida empieza a las ${partida.fechaHora.toISOString()}`,
      destinatario: nombreDePartida(partida),
      partidaId: partida.id,
    });
  }
  return proximas.length;
}

module.exports = {
  listar,
  obtener,
  programarHorario,
  terminar,
  subirEvidencia,
  reportarMarcador,
  abrirDisputa,
  enviarRecordatorios,
};
