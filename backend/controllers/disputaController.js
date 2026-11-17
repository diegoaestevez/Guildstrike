const { db, buscarPorId } = require('../config/db');
const Notificacion = require('../models/Notificacion');
const { EstadoDisputa } = require('../models/constantes');

// GET /api/disputas?estado=ABIERTA (árbitro) -> por defecto las no resueltas
function listar(req, res) {
  const { estado } = req.query;
  const disputas = estado
    ? db.disputas.filter((d) => d.estado === estado)
    : db.disputas.filter((d) => d.estado !== EstadoDisputa.RESUELTA);
  res.json(disputas);
}

// GET /api/disputas/:id (árbitro) -> incluye reportes y evidencias para revisarlas
function obtener(req, res) {
  const disputa = buscarPorId('disputas', req.params.id, 'Disputa');
  const partida = buscarPorId('partidas', disputa.partidaId, 'Partida');
  res.json({ ...disputa, reportes: partida.reportes, evidencias: partida.evidencias });
}

// PATCH /api/disputas/:id/asignar (árbitro) -> se la asigna a sí mismo
function asignar(req, res) {
  const disputa = buscarPorId('disputas', req.params.id, 'Disputa');
  disputa.asignarArbitro(req.usuario.id);
  req.usuario.tomarDisputa(disputa.id);
  res.json(disputa);
}

// PATCH /api/disputas/:id/resolver (árbitro) -> RF-07
async function resolver(req, res) {
  const disputa = buscarPorId('disputas', req.params.id, 'Disputa');
  const partida = buscarPorId('partidas', disputa.partidaId, 'Partida');
  disputa.resolverDictamen(partida, req.usuario.id, req.body.ganadorId, req.body.dictamen);

  await Notificacion.enviar({
    tipo: 'DISPUTA_RESUELTA',
    mensaje: `Dictamen: ${disputa.dictamen}`,
    destinatario: `Partida ${partida.id}`,
    partidaId: partida.id,
  });
  res.json({ disputa, partida });
}

module.exports = { listar, obtener, asignar, resolver };
