const Partida = require('./Partida');
const AppError = require('../utils/AppError');

// Una ronda del bracket: agrupa las partidas que se juegan al mismo nivel
class Ronda {
  constructor({ torneoId, numero, equipoIds }) {
    if (!equipoIds || equipoIds.length < 2) throw new AppError('Una ronda necesita al menos 2 equipos');
    this.numero = numero;
    this.torneoId = torneoId;
    this.partidas = this.emparejar(equipoIds);
  }

  // Empareja de 2 en 2; si sobra uno, recibe pase directo (RF-03)
  emparejar(equipoIds) {
    const partidas = [];
    for (let i = 0; i < equipoIds.length; i += 2) {
      partidas.push(new Partida({
        torneoId: this.torneoId,
        ronda: this.numero,
        equipo1Id: equipoIds[i],
        equipo2Id: equipoIds[i + 1] ?? null,
      }));
    }
    return partidas;
  }

  // RN-02: completa cuando todas están Finalizadas o Auditadas
  estaCompleta() {
    return this.partidas.every((p) => p.estaCerrada());
  }

  obtenerGanadores() {
    if (!this.estaCompleta()) throw new AppError('La ronda todavía tiene partidas sin cerrar');
    return this.partidas.map((p) => p.ganadorId);
  }

  // Vista resumida para mostrar en el bracket (RF-14)
  resumen() {
    return {
      numero: this.numero,
      partidas: this.partidas.map((p) => ({
        partidaId: p.id,
        equipo1Id: p.equipo1Id,
        equipo2Id: p.equipo2Id,
        estado: p.estado,
        fechaHora: p.fechaHora,
        marcador: p.marcadorEquipo1 !== null ? `${p.marcadorEquipo1}-${p.marcadorEquipo2}` : null,
        ganadorId: p.ganadorId,
      })),
    };
  }
}

module.exports = Ronda;
