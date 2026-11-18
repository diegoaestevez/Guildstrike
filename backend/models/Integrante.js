const Usuario = require('./Usuario');

class Integrante extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo);
    this.rol = 'INTEGRANTE';
    this.equipo = null;
  }
}

module.exports = Integrante;
