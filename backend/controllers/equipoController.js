const { db, buscarPorId } = require('../config/db');
const Equipo = require('../models/Equipo');
const AppError = require('../utils/AppError');

// Solo el capitán del equipo puede modificarlo
function obtenerEquipoPropio(req) {
  const equipo = buscarPorId('equipos', req.params.id, 'Equipo');
  if (!req.usuario.esCapitanDe(equipo.id)) {
    throw new AppError('Solo el capitán de este equipo puede hacer eso', 403);
  }
  return equipo;
}

// POST /api/equipos (capitán)
function crear(req, res) {
  if (req.usuario.tieneEquipo()) throw new AppError('Ya eres capitán de un equipo');
  const equipo = new Equipo({ nombre: req.body.nombre, tag: req.body.tag, capitanId: req.usuario.id });
  (req.body.integrantes || []).forEach((gamertag) => equipo.agregarIntegrante(gamertag));
  db.equipos.push(equipo);
  req.usuario.equipoId = equipo.id;
  res.status(201).json(equipo);
}

// GET /api/equipos
function listar(req, res) {
  res.json(db.equipos);
}

// GET /api/equipos/:id
function obtener(req, res) {
  res.json(buscarPorId('equipos', req.params.id, 'Equipo'));
}

// POST /api/equipos/:id/integrantes (capitán)
function agregarIntegrante(req, res) {
  const equipo = obtenerEquipoPropio(req);
  equipo.agregarIntegrante(req.body.gamertag);
  res.status(201).json(equipo);
}

// DELETE /api/equipos/:id/integrantes/:gamertag (capitán)
function quitarIntegrante(req, res) {
  const equipo = obtenerEquipoPropio(req);
  equipo.quitarIntegrante(req.params.gamertag);
  res.json(equipo);
}

// GET /api/equipos/:id/historial -> RF-09
function obtenerHistorial(req, res) {
  const equipo = buscarPorId('equipos', req.params.id, 'Equipo');
  const partidas = db.partidas
    .filter((p) => p.incluyeEquipo(equipo.id))
    .map((p) => ({
      partidaId: p.id,
      torneoId: p.torneoId,
      ronda: p.ronda,
      rivalId: p.equipo1Id === equipo.id ? p.equipo2Id : p.equipo1Id,
      estado: p.estado,
      fechaHora: p.fechaHora,
      marcador: p.marcadorEquipo1 !== null ? `${p.marcadorEquipo1}-${p.marcadorEquipo2}` : null,
      gano: p.ganadorId === null ? null : p.ganadorId === equipo.id,
      evidencias: p.evidencias.filter((e) => e.equipoId === equipo.id),
    }));
  res.json({ equipo: equipo.nombre, partidas });
}

module.exports = { crear, listar, obtener, agregarIntegrante, quitarIntegrante, obtenerHistorial };
