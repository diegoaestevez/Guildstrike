const Ronda = require('./Ronda');
// R-02: Torneo ya no pregunta por el formato; cada formato es una subclase que arma sus emparejamientos (OCP)
// tambien alto acoplamiento porque crea rondas y conoce detalles de las partidas
class Torneo {
  constructor(id, nombre, configuracion = {}) {
    this.id = id;
    this.nombre = nombre;
    this.estado = 'ACTIVO';
    this.equipos = [];
    this.rondas = [];
    this.configuracion = {
      limiteEvidenciaMinutos: 5,
      tamanoMaximoEvidenciaBytes: 5 * 1024 * 1024,
      formatosEvidencia: ['image/png', 'image/jpeg'],
      ...configuracion
    };
  }

  inscribirEquipo(equipo) {
    if (this.estado !== 'ACTIVO') {
      throw new Error('El torneo no acepta inscripciones');
    }
    if (!equipo.esValido()) {
      throw new Error('El equipo debe tener entre 4 y 9 integrantes');
    }
    if (this.equipos.some((inscrito) => inscrito.id === equipo.id)) {
      throw new Error('El equipo ya está inscrito');
    }
    this.equipos.push(equipo);
  }

  cerrarInscripciones() {
    if (this.estado !== 'ACTIVO') {
      throw new Error('El torneo ya no está activo');
    }
    if (this.equipos.length < 4) {
      throw new Error('Se requieren al menos 4 equipos');
    }
    this.estado = 'EN_CURSO';
    return this.generarRonda(1);
  }

  generarRonda(numero) {
    if (this.rondas.length && !this.rondas[this.rondas.length - 1].estaCompleta()) {
      throw new Error('La ronda anterior aún no está completa');
    }
    const ronda = new Ronda(numero);
    this.armarEmparejamientos(ronda, this.equipos.slice());
    this.rondas.push(ronda);
    return ronda;
  }

  // R-02: cada formato lo implementa en su subclase (por ejemplo TorneoEliminacionSimple)
  armarEmparejamientos(ronda, equipos) {
    throw new Error('Formato de torneo no soportado');
  }
}

module.exports = Torneo;
