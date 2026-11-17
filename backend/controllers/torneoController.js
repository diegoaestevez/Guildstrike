const { db, buscarPorId } = require('../config/db');
const Torneo = require('../models/Torneo');
const { EstadoTorneo } = require('../models/constantes');
const AppError = require('../utils/AppError');

// POST /api/torneos (árbitro)
function crear(req, res) {
  const torneo = new Torneo({ ...req.body, creadoPor: req.usuario.id });
  db.torneos.push(torneo);
  res.status(201).json(torneo);
}

// GET /api/torneos?estado=EN_CURSO
function listar(req, res) {
  const { estado } = req.query;
  res.json(estado ? db.torneos.filter((t) => t.estado === estado) : db.torneos);
}

// GET /api/torneos/:id
function obtener(req, res) {
  res.json(buscarPorId('torneos', req.params.id, 'Torneo'));
}

// PATCH /api/torneos/:id/abrir (árbitro)
function abrirInscripciones(req, res) {
  const torneo = buscarPorId('torneos', req.params.id, 'Torneo');
  torneo.abrirInscripciones();
  res.json(torneo);
}

// POST /api/torneos/:id/equipos (capitán) -> RF-01
function inscribirEquipo(req, res) {
  const torneo = buscarPorId('torneos', req.params.id, 'Torneo');
  if (!req.usuario.tieneEquipo()) throw new AppError('Primero crea un equipo');
  const equipo = buscarPorId('equipos', req.usuario.equipoId, 'Equipo');
  torneo.inscribirParticipante(equipo);
  res.status(201).json({ mensaje: `Equipo ${equipo.nombre} inscrito`, torneo });
}

// PATCH /api/torneos/:id/cerrar (árbitro) -> RF-02
function cerrarInscripciones(req, res) {
  const torneo = buscarPorId('torneos', req.params.id, 'Torneo');
  if (!torneo.cerrarInscripciones()) {
    return res.status(409).json({
      mensaje: `Torneo suspendido: se necesitan al menos ${Torneo.MINIMO_EQUIPOS} equipos`,
      torneo,
    });
  }
  const ronda = torneo.generarBrackets();
  db.partidas.push(...ronda.partidas);
  res.json({ torneo, brackets: torneo.obtenerBrackets() });
}

// GET /api/torneos/:id/brackets -> RF-14
function obtenerBrackets(req, res) {
  const torneo = buscarPorId('torneos', req.params.id, 'Torneo');
  if (torneo.estado === EstadoTorneo.BORRADOR || torneo.estado === EstadoTorneo.INSCRIPCIONES) {
    return res.json({ mensaje: 'El torneo está por iniciar, las llaves aún no se generan' });
  }
  res.json({ estado: torneo.estado, campeonId: torneo.campeonId, rondas: torneo.obtenerBrackets() });
}

// POST /api/torneos/:id/siguiente-ronda (árbitro) -> RN-02
function avanzarRonda(req, res) {
  const torneo = buscarPorId('torneos', req.params.id, 'Torneo');
  const nuevaRonda = torneo.avanzarRonda();

  if (!nuevaRonda) {
    const campeon = buscarPorId('equipos', torneo.campeonId, 'Equipo');
    return res.json({ mensaje: `¡Torneo terminado! Campeón: ${campeon.nombre}`, torneo });
  }
  db.partidas.push(...nuevaRonda.partidas);
  res.json({ mensaje: `Inicia la ronda ${nuevaRonda.numero}`, rondas: torneo.obtenerBrackets() });
}

module.exports = {
  crear,
  listar,
  obtener,
  abrirInscripciones,
  inscribirEquipo,
  cerrarInscripciones,
  obtenerBrackets,
  avanzarRonda,
};
