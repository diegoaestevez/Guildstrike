const Torneo = require('./Torneo');

// R-02: formato de eliminación simple, los equipos se enfrentan en orden y el impar pasa directo
class TorneoEliminacionSimple extends Torneo {
  armarEmparejamientos(ronda, equipos) {
    for (let indice = 0; indice < equipos.length - 1; indice += 2) {
      ronda.agregarPartida(equipos[indice], equipos[indice + 1], new Date());
    }
    if (equipos.length % 2 === 1) {
      ronda.paseAutomatico = equipos[equipos.length - 1];
    }
  }
}

module.exports = TorneoEliminacionSimple;
