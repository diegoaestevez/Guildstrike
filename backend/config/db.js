// "Base de datos" en memoria. Cuando definamos la BD real (Mongo, Postgres...)
// solo se cambia este archivo y la forma en que los controladores guardan/buscan.
const AppError = require('../utils/AppError');

let siguienteId = 1;

const db = {
  usuarios: [],
  equipos: [],
  torneos: [],
  partidas: [],
  disputas: [],
  notificaciones: [],
};

function generarId() {
  return siguienteId++;
}

// Busca por id dentro de una colección o lanza 404
function buscarPorId(coleccion, id, etiqueta = 'Recurso') {
  const elemento = db[coleccion].find((x) => x.id === Number(id));
  if (!elemento) throw new AppError(`${etiqueta} con id ${id} no encontrado`, 404);
  return elemento;
}

module.exports = { db, generarId, buscarPorId };
