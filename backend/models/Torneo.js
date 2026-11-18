const Ronda = require('./Ronda');

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
    if (this.configuracion.formato !== undefined
      && this.configuracion.formato !== 'eliminacion-simple') {
      throw new Error('Formato de torneo no soportado');
    }
    const ronda = new Ronda(numero);
    const equipos = this.equipos.slice();
    for (let indice = 0; indice < equipos.length - 1; indice += 2) {
      ronda.agregarPartida(equipos[indice], equipos[indice + 1], new Date());
    }
    if (equipos.length % 2 === 1) {
      const pase = equipos[equipos.length - 1];
      ronda.paseAutomatico = pase;
    }
    this.rondas.push(ronda);
    return ronda;
  }
}

module.exports = Torneo;
