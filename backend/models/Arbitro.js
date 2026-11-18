const Usuario = require('./Usuario');

class Arbitro extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo);
    this.rol = 'ARBITRO';
    this.disputasAsignadas = [];
  }

  asignarDisputa(disputa) {
    if (!this.disputasAsignadas.includes(disputa)) {
      this.disputasAsignadas.push(disputa);
    }
    disputa.asignarArbitro(this);
  }
}

module.exports = Arbitro;