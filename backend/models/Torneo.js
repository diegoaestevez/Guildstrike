const { generarId } = require('../config/db');
const { EstadoTorneo } = require('./constantes');
const Ronda = require('./Ronda');
const AppError = require('../utils/AppError');

class Torneo {
  static MINIMO_EQUIPOS = 4; // RN-01

  constructor({ nombre, disciplina, fechaInicio, creadoPor, tiempoLimiteEvidencia = 5 }) {
    if (!nombre || !disciplina) throw new AppError('El torneo necesita nombre y disciplina');
    this.id = generarId();
    this.nombre = nombre;
    this.disciplina = disciplina;
    this.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    this.estado = EstadoTorneo.BORRADOR;
    this.creadoPor = creadoPor;
    this.tiempoLimiteEvidencia = Number(tiempoLimiteEvidencia); // SUP-02, en minutos
    this.equipoIds = []; // agregación: los equipos existen sin el torneo
    this.rondas = []; // composición: las rondas/partidas son del torneo
    this.campeonId = null;
  }

  get rondaActual() {
    return this.rondas[this.rondas.length - 1] ?? null;
  }

  abrirInscripciones() {
    if (this.estado !== EstadoTorneo.BORRADOR) {
      throw new AppError('Solo un torneo en borrador puede abrir inscripciones');
    }
    this.estado = EstadoTorneo.INSCRIPCIONES;
  }

  // RF-01 / RN-01
  inscribirParticipante(equipo) {
    if (this.estado !== EstadoTorneo.INSCRIPCIONES) {
      throw new AppError('El torneo no tiene inscripciones abiertas');
    }
    if (!equipo.validarMinimoIntegrantes()) {
      throw new AppError(`El equipo necesita al menos ${equipo.constructor.MINIMO_INTEGRANTES} integrantes`);
    }
    if (this.equipoIds.includes(equipo.id)) throw new AppError('El equipo ya está inscrito');
    this.equipoIds.push(equipo.id);
  }

  // RF-02: true si se cerró, false si se suspende por falta de equipos
  cerrarInscripciones() {
    if (this.estado !== EstadoTorneo.INSCRIPCIONES) {
      throw new AppError('El torneo no tiene inscripciones abiertas');
    }
    if (this.equipoIds.length < Torneo.MINIMO_EQUIPOS) {
      this.estado = EstadoTorneo.SUSPENDIDO;
      return false;
    }
    this.estado = EstadoTorneo.EN_CURSO;
    return true;
  }

  // RF-02 / SUP-04: eliminación sencilla, primera ronda con equipos revueltos
  generarBrackets() {
    if (this.estado !== EstadoTorneo.EN_CURSO || this.rondas.length > 0) {
      throw new AppError('Las llaves solo se generan una vez, al cerrar inscripciones');
    }
    const revueltos = [...this.equipoIds].sort(() => Math.random() - 0.5);
    return this.crearRonda(revueltos);
  }

  crearRonda(equipoIds) {
    const ronda = new Ronda({ torneoId: this.id, numero: this.rondas.length + 1, equipoIds });
    this.rondas.push(ronda);
    return ronda;
  }

  // RN-02: no hay ronda nueva hasta que la actual esté completa
  avanzarRonda() {
    if (this.estado !== EstadoTorneo.EN_CURSO) throw new AppError('El torneo no está en curso');
    if (!this.rondaActual.estaCompleta()) {
      throw new AppError('Aún hay partidas de la ronda actual sin finalizar o en disputa');
    }
    const ganadores = this.rondaActual.obtenerGanadores();
    if (ganadores.length === 1) {
      this.campeonId = ganadores[0];
      this.estado = EstadoTorneo.FINALIZADO;
      return null;
    }
    return this.crearRonda(ganadores);
  }

  // RF-14
  obtenerBrackets() {
    return this.rondas.map((r) => r.resumen());
  }

  toJSON() {
    const { rondas, ...datos } = this;
    return { ...datos, numRondas: rondas.length };
  }
}

module.exports = Torneo;
