// Nota: los controladores asumen que authMiddleware deja al usuario logueado en req.usuario
const { db, buscarPorId } = require('../config/db');
const { crearUsuario, convertirRol } = require('../models/Usuario');
const { RolUsuario } = require('../models/constantes');
const AppError = require('../utils/AppError');

function validarCorreoLibre(correo) {
  if (db.usuarios.some((u) => u.correo === String(correo).toLowerCase())) {
    throw new AppError('Ya existe un usuario con ese correo', 409);
  }
}

// POST /api/auth/registro -> cualquiera se registra como capitán
function registrar(req, res) {
  validarCorreoLibre(req.body.correo);
  const capitan = crearUsuario(RolUsuario.CAPITAN, req.body);
  db.usuarios.push(capitan);
  res.status(201).json(capitan);
}

// POST /api/auth/login
function iniciarSesion(req, res) {
  const { correo, contrasena } = req.body;
  const usuario = db.usuarios.find((u) => u.correo === String(correo).toLowerCase());
  if (!usuario || !usuario.autenticar(contrasena)) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }
  // Pendiente: generar token (JWT) cuando hagamos authMiddleware
  res.json({ mensaje: 'Sesión iniciada', usuario });
}

// GET /api/auth/usuarios (admin)
function listarUsuarios(req, res) {
  const { rol } = req.query;
  res.json(rol ? db.usuarios.filter((u) => u.rol === rol) : db.usuarios);
}

// POST /api/auth/usuarios (admin) -> alta de árbitros/admins/capitanes
function darDeAlta(req, res) {
  validarCorreoLibre(req.body.correo);
  const usuario = crearUsuario(req.body.rol, req.body);
  db.usuarios.push(usuario);
  res.status(201).json(usuario);
}

// PATCH /api/auth/usuarios/:id/rol (admin)
function cambiarRol(req, res) {
  const usuario = buscarPorId('usuarios', req.params.id, 'Usuario');
  const actualizado = convertirRol(usuario, req.body.rol);
  db.usuarios[db.usuarios.indexOf(usuario)] = actualizado;
  res.json(actualizado);
}

// DELETE /api/auth/usuarios/:id (admin)
function darDeBaja(req, res) {
  const usuario = buscarPorId('usuarios', req.params.id, 'Usuario');
  if (usuario.id === req.usuario.id) throw new AppError('No puedes darte de baja a ti mismo');
  db.usuarios.splice(db.usuarios.indexOf(usuario), 1);
  res.status(204).end();
}

module.exports = { registrar, iniciarSesion, listarUsuarios, darDeAlta, cambiarRol, darDeBaja };
