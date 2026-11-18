const Partida = require('./Partida');

class Ronda {
  constructor(numero) {
    this.numero = numero;
    this.partidas = [];
  }

  agregarPartida(equipoA, equipoB, fechaProgramada) {
    if (!equipoA || !equipoB) {
      throw new Error('La ronda no admite partidas incompletas');
    }
    const partida = new Partida(`${this.numero}-${this.partidas.length + 1}`, equipoA, equipoB, fechaProgramada);
    this.partidas.push(partida);
    return partida;
  }

  estaCompleta() {
    return this.partidas.length > 0
      && this.partidas.every((partida) => ['FINALIZADA', 'AUDITADA'].includes(partida.estado));
  }
}

module.exports = Ronda;
