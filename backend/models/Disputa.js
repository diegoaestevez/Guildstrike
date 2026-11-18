class Disputa {
  constructor(partida, solicitante, motivo) {
    if (!partida || !solicitante || !motivo) {
      throw new Error('Partida, solicitante y motivo son obligatorios');
    }
    this.partida = partida;
    this.solicitante = solicitante;
    this.motivo = motivo;
    this.estado = 'ABIERTO';
    this.arbitro = null;
    this.equipoGanador = null;
    this.fechaCreacion = new Date();
    this.fechaResolucion = null;
    this.justificacion = null;
  }

  asignarArbitro(arbitro) {
    if (this.estado !== 'ABIERTO') {
      throw new Error('El ticket ya no está disponible');
    }
    this.arbitro = arbitro;
  }

  resolver(arbitro, equipoGanador, justificacion) {
    if (this.estado !== 'ABIERTO' || this.arbitro !== arbitro || !justificacion) {
      throw new Error('El ticket no puede resolverse con esos datos');
    }
    if (!this.partida.equipos.includes(equipoGanador)) {
      throw new Error('El ganador debe participar en la partida');
    }
    this.equipoGanador = equipoGanador;
    this.justificacion = justificacion;
    this.estado = 'RESUELTO';
    this.fechaResolucion = new Date();
    this.partida.aplicarDictamen(this);
  }
}

module.exports = Disputa;