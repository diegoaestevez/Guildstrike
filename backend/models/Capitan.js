const Usuario = require('./Usuario');

class Capitan extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo);
    this.rol = 'CAPITAN';
    this.equipo = null;
  }

  asignarEquipo(equipo) {
    if (this.equipo && this.equipo !== equipo) {
      throw new Error('Un capitán solo puede representar un equipo');
    }
    this.equipo = equipo;
  }
}

module.exports = Capitan;
