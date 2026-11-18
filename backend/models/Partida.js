const ReporteResultado = require('./ReporteResultado');
const Evidencia = require('./Evidencia');
const EventoPartida = require('./EventoPartida');
const Disputa = require('./Disputa');

class Partida {
  constructor(id, equipoA, equipoB, fechaProgramada) {
    if (!equipoA || !equipoB || equipoA === equipoB) {
      throw new Error('Una partida requiere dos equipos distintos');
    }
    this.id = id;
    this.equipos = [equipoA, equipoB];
    this.fechaProgramada = new Date(fechaProgramada);
    this.fechaFin = null;
    this.estado = 'PROGRAMADA';
    this.reportes = [];
    this.evidencias = [];
    this.disputa = null;
    this.ganador = null;
    this.eventos = [];
  }

  iniciar() {
    this._exigirEstado('PROGRAMADA');
    this.estado = 'EN_CURSO';
    this._registrar('PARTIDA_INICIADA', null, 'La partida inició');
  }

  finalizarJuego(fecha = new Date()) {
    if (!['EN_CURSO', 'PROGRAMADA'].includes(this.estado)) {
      throw new Error('La partida no puede finalizarse en su estado actual');
    }
    this.fechaFin = new Date(fecha);
    this._validarReportes();
  }

  registrarResultado(capitan, marcadorPropio, marcadorRival, fecha = new Date()) {
    this._exigirNoCongelada();
    const equipo = capitan.equipo;
    if (!this.equipos.includes(equipo)) {
      throw new Error('El capitán no participa en esta partida');
    }
    if (this.reportes.some((reporte) => reporte.equipo === equipo)) {
      throw new Error('El equipo ya reportó un resultado');
    }
    const reporte = new ReporteResultado(capitan, equipo, marcadorPropio, marcadorRival, fecha);
    this.reportes.push(reporte);
    this._registrar('RESULTADO_REPORTADO', capitan, `Marcador de ${equipo.nombre}`);
    this._validarReportes();
    return reporte;
  }

  agregarEvidencia(capitan, evidenciaODatos, reglas = {}) {
    this._exigirNoCongelada();
    if (!this.fechaFin) {
      throw new Error('La evidencia sólo se recibe al finalizar la partida');
    }
    const datos = evidenciaODatos instanceof Evidencia
      ? { evidencia: evidenciaODatos, equipo: capitan.equipo }
      : evidenciaODatos;
    if (!datos || capitan.equipo !== datos.equipo) {
      throw new Error('La evidencia debe asociarse al equipo del capitán');
    }
    const evidencia = datos.evidencia || new Evidencia(datos);
    evidencia.validar(reglas, this.fechaFin);
    this.evidencias.push({ equipo: capitan.equipo, evidencia });
    this._registrar('EVIDENCIA_AGREGADA', capitan, evidencia.nombre);
    return evidencia;
  }

  abrirDisputa(solicitante, motivo) {
    this._exigirNoCongelada();
    if (solicitante.equipo && !this.equipos.includes(solicitante.equipo)) {
      throw new Error('El solicitante no participa en la partida');
    }
    if (this.disputa) {
      throw new Error('La partida ya tiene una disputa');
    }
    this.disputa = new Disputa(this, solicitante, motivo);
    this.estado = 'CONGELADA';
    this._registrar('DISPUTA_ABIERTA', solicitante, motivo);
    return this.disputa;
  }

  aplicarDictamen(disputa) {
    if (this.disputa !== disputa || disputa.estado !== 'RESUELTO') {
      throw new Error('El dictamen no corresponde a esta partida');
    }
    this.ganador = disputa.equipoGanador;
    this.estado = 'AUDITADA';
    this._registrar('DICTAMEN_EMITIDO', disputa.arbitro, disputa.justificacion);
  }

  _validarReportes() {
    if (this.reportes.length !== 2 || this.estado === 'CONGELADA') {
      return;
    }
    const [primero, segundo] = this.reportes;
    if (primero.marcadorPropio === segundo.marcadorRival
      && primero.marcadorRival === segundo.marcadorPropio) {
      this.ganador = primero.marcadorPropio > primero.marcadorRival
        ? primero.equipo : segundo.equipo;
      this.estado = 'FINALIZADA';
      this._registrar('RESULTADO_VALIDADO', null, 'Los capitanes coincidieron');
      return;
    }
    this.disputa = new Disputa(this, segundo.capitan, 'Marcadores discrepantes');
    this.estado = 'CONGELADA';
    this._registrar('DISPUTA_ABIERTA', segundo.capitan, 'Marcadores discrepantes');
  }

  _exigirNoCongelada() {
    if (this.estado === 'CONGELADA' || this.estado === 'AUDITADA' || this.estado === 'FINALIZADA') {
      throw new Error('La partida no admite más cambios');
    }
  }

  _exigirEstado(estado) {
    if (this.estado !== estado) {
      throw new Error(`Se esperaba estado ${estado}`);
    }
  }

  _registrar(tipo, usuario, descripcion) {
    this.eventos.push(new EventoPartida(tipo, usuario, descripcion));
  }
}

module.exports = Partida;