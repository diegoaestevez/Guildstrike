const { generarId } = require('../config/db');
const { EstadoDisputa } = require('./constantes');
const AppError = require('../utils/AppError');

class Disputa {
  constructor({ partidaId, abiertaPor, motivo }) {
    this.id = generarId();
    this.partidaId = partidaId;
    this.abiertaPor = abiertaPor; // null si la abrió el sistema por marcadores distintos
    this.motivo = motivo;
    this.estado = EstadoDisputa.ABIERTA;
    this.fechaApertura = new Date();
    this.arbitroId = null;
    this.dictamen = null;
    this.ganadorId = null;
    this.fechaResolucion = null;
  }

  // RF-06 / RN-04: crea la disputa y congela la partida
  static abrirTicket(partida, abiertaPor, motivo) {
    if (!motivo) throw new AppError('Indica el motivo de la disputa');
    const disputa = new Disputa({ partidaId: partida.id, abiertaPor, motivo });
    partida.congelarPorDisputa(disputa.id, abiertaPor);
    return disputa;
  }

  asignarArbitro(arbitroId) {
    if (this.estado === EstadoDisputa.RESUELTA) throw new AppError('La disputa ya fue resuelta');
    if (this.arbitroId && this.arbitroId !== arbitroId) {
      throw new AppError('La disputa ya tiene otro árbitro asignado');
    }
    this.arbitroId = arbitroId;
    this.estado = EstadoDisputa.EN_REVISION;
  }

  // RF-07
  resolverDictamen(partida, arbitroId, ganadorId, dictamen) {
    if (this.estado === EstadoDisputa.RESUELTA) throw new AppError('La disputa ya fue resuelta');
    if (this.arbitroId !== arbitroId) {
      throw new AppError('Solo el árbitro asignado puede resolver esta disputa', 403);
    }
    if (!ganadorId) throw new AppError('Debes seleccionar un ganador para emitir el dictamen');
    if (!dictamen) throw new AppError('Debes escribir la justificación del dictamen');

    partida.aplicarDictamen(ganadorId, dictamen, arbitroId);
    this.ganadorId = Number(ganadorId);
    this.dictamen = dictamen;
    this.estado = EstadoDisputa.RESUELTA;
    this.fechaResolucion = new Date();
  }
}

module.exports = Disputa;
