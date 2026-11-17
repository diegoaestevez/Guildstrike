const { generarId } = require('../config/db');
const AppError = require('../utils/AppError');

class Equipo {
  static MINIMO_INTEGRANTES = 4; // RF-01 / RN-01
  static MAXIMO_INTEGRANTES = 6; // SUP-01: si cambia, solo se ajusta aquí

  constructor({ nombre, tag, capitanId }) {
    if (!nombre || !tag) throw new AppError('El equipo necesita nombre y tag');
    this.id = generarId();
    this.nombre = nombre;
    this.tag = tag.toUpperCase();
    this.capitanId = capitanId;
    this.integrantes = []; // gamertags
    this.fechaCreacion = new Date();
  }

  get numIntegrantes() {
    return this.integrantes.length;
  }

  agregarIntegrante(gamertag) {
    if (!gamertag) throw new AppError('El integrante necesita un gamertag');
    if (!this.validarCupo()) {
      throw new AppError(`El equipo ya tiene el máximo de ${Equipo.MAXIMO_INTEGRANTES} integrantes`);
    }
    if (this.integrantes.includes(gamertag)) throw new AppError(`${gamertag} ya está en el equipo`);
    this.integrantes.push(gamertag);
  }

  quitarIntegrante(gamertag) {
    this.integrantes = this.integrantes.filter((i) => i !== gamertag);
  }

  // true si todavía cabe alguien
  validarCupo() {
    return this.integrantes.length < Equipo.MAXIMO_INTEGRANTES;
  }

  validarMinimoIntegrantes() {
    return this.integrantes.length >= Equipo.MINIMO_INTEGRANTES;
  }

  toJSON() {
    return { ...this, numIntegrantes: this.numIntegrantes };
  }
}

module.exports = Equipo;
