const { generarId } = require('../config/db');
const { EstadoPartida } = require('./constantes');
const AppError = require('../utils/AppError');

class Partida {
  static VICTORIAS_NECESARIAS = 2; // SUP-05: todo es al mejor de 3

  constructor({ torneoId, ronda, equipo1Id, equipo2Id = null }) {
    this.id = generarId();
    this.torneoId = torneoId;
    this.ronda = ronda;
    this.equipo1Id = equipo1Id;
    this.equipo2Id = equipo2Id;
    this.fechaHora = null;
    this.estado = EstadoPartida.PENDIENTE;
    this.fechaFin = null;
    this.reportes = {}; // { [equipoId]: { marcadorEquipo1, marcadorEquipo2, reportadoPor, fecha } }
    this.marcadorEquipo1 = null;
    this.marcadorEquipo2 = null;
    this.evidencias = []; // composición: 0..2
    this.disputaId = null;
    this.ganadorId = null;
    this.recordatorioEnviado = false;
    this.historial = []; // RF-15: bitácora inalterable

    // RF-03: sin rival = pase directo
    if (equipo2Id === null) {
      this.estado = EstadoPartida.FINALIZADA;
      this.ganadorId = equipo1Id;
      this.registrarEvento('PASE_DIRECTO', 'Pase directo por número impar de equipos');
    } else {
      this.registrarEvento('CREADA', `Ronda ${ronda}: equipo ${equipo1Id} vs equipo ${equipo2Id}`);
    }
  }

  // ---------- Bitácora ----------
  registrarEvento(tipo, detalle, usuarioId = null) {
    this.historial.push(Object.freeze({ tipo, detalle, usuarioId, fecha: new Date() }));
  }

  // ---------- Consultas ----------
  esPaseDirecto() {
    return this.equipo2Id === null;
  }

  incluyeEquipo(equipoId) {
    return this.equipo1Id === Number(equipoId) || this.equipo2Id === Number(equipoId);
  }

  // RN-02: cuenta como cerrada si está Finalizada o Auditada
  estaCerrada() {
    return this.estado === EstadoPartida.FINALIZADA || this.estado === EstadoPartida.AUDITADA;
  }

  obtenerLimiteEvidencia(minutosLimite) {
    if (!this.fechaFin) return null;
    return new Date(this.fechaFin.getTime() + minutosLimite * 60 * 1000);
  }

  dentroDelLimite(minutosLimite) {
    const limite = this.obtenerLimiteEvidencia(minutosLimite);
    return limite !== null && new Date() <= limite;
  }

  // ---------- Acciones ----------
  // RF-03 / RF-10
  programarHorario(fechaHora, usuarioId) {
    if (this.esPaseDirecto()) throw new AppError('Un pase directo no necesita horario');
    if (this.estaCerrada()) throw new AppError('La partida ya finalizó, no se puede editar el horario');
    if (this.estado === EstadoPartida.EN_DISPUTA) throw new AppError('La partida está en disputa');
    if (this.estado === EstadoPartida.ESPERANDO_RESULTADOS) throw new AppError('La partida ya se jugó');
    const fecha = new Date(fechaHora);
    if (Number.isNaN(fecha.getTime())) throw new AppError('Fecha/hora inválida');

    const yaTeniaHorario = this.fechaHora !== null;
    this.fechaHora = fecha;
    this.estado = EstadoPartida.PROGRAMADA;
    this.recordatorioEnviado = false;
    this.registrarEvento(yaTeniaHorario ? 'REPROGRAMADA' : 'PROGRAMADA', `Horario: ${fecha.toISOString()}`, usuarioId);
  }

  // Marca el fin de la partida; desde aquí corre el tiempo para subir evidencia
  terminar(usuarioId) {
    if (this.estado !== EstadoPartida.PROGRAMADA) {
      throw new AppError('Solo se puede terminar una partida programada');
    }
    this.fechaFin = new Date();
    this.estado = EstadoPartida.ESPERANDO_RESULTADOS;
    this.registrarEvento('TERMINADA', 'Inicia el tiempo para subir evidencias', usuarioId);
  }

  // RF-04 / RN-03
  recibirEvidencia(evidencia, minutosLimite) {
    if (this.estado !== EstadoPartida.ESPERANDO_RESULTADOS) {
      throw new AppError('La partida no está esperando resultados');
    }
    if (!this.incluyeEquipo(evidencia.equipoId)) throw new AppError('Ese equipo no juega esta partida', 403);
    if (!this.dentroDelLimite(minutosLimite)) throw new AppError('El tiempo para subir evidencia ya expiró');
    if (this.evidencias.some((e) => e.equipoId === evidencia.equipoId)) {
      throw new AppError('Este equipo ya subió su evidencia');
    }
    this.evidencias.push(evidencia);
    this.registrarEvento('EVIDENCIA', `Evidencia ${evidencia.id} del equipo ${evidencia.equipoId}`, evidencia.subidaPor);
  }

  // Cada capitán reporta el marcador completo (equipo1 - equipo2)
  reportarMarcador(equipoId, marcador1, marcador2, usuarioId, minutosLimite) {
    equipoId = Number(equipoId);
    if (this.estado !== EstadoPartida.ESPERANDO_RESULTADOS) {
      throw new AppError('La partida no está esperando resultados');
    }
    if (!this.incluyeEquipo(equipoId)) throw new AppError('Ese equipo no juega esta partida', 403);
    if (!this.dentroDelLimite(minutosLimite)) throw new AppError('El tiempo para reportar ya expiró');
    if (!this.evidencias.some((e) => e.equipoId === equipoId)) {
      throw new AppError('Primero sube la evidencia antes de reportar el marcador');
    }
    if (this.reportes[equipoId]) throw new AppError('Este equipo ya reportó su marcador');
    if (!Partida.esMarcadorValido(marcador1, marcador2)) {
      throw new AppError('Marcador inválido para un mejor de 3 (ej. 2-0, 2-1, 1-2, 0-2)');
    }

    this.reportes[equipoId] = {
      marcadorEquipo1: Number(marcador1),
      marcadorEquipo2: Number(marcador2),
      reportadoPor: usuarioId,
      fecha: new Date(),
    };
    this.registrarEvento('MARCADOR_REPORTADO', `Equipo ${equipoId} reporta ${marcador1}-${marcador2}`, usuarioId);
  }

  ambosReportaron() {
    return Boolean(this.reportes[this.equipo1Id] && this.reportes[this.equipo2Id]);
  }

  // RF-05: null = falta un reporte, true = coinciden (finaliza), false = no coinciden
  validarMarcador() {
    if (!this.ambosReportaron()) return null;
    const a = this.reportes[this.equipo1Id];
    const b = this.reportes[this.equipo2Id];
    const coinciden = a.marcadorEquipo1 === b.marcadorEquipo1 && a.marcadorEquipo2 === b.marcadorEquipo2;

    if (coinciden) {
      this.marcadorEquipo1 = a.marcadorEquipo1;
      this.marcadorEquipo2 = a.marcadorEquipo2;
      this.ganadorId = a.marcadorEquipo1 > a.marcadorEquipo2 ? this.equipo1Id : this.equipo2Id;
      this.estado = EstadoPartida.FINALIZADA;
      this.registrarEvento('VALIDADA', `Marcador validado ${this.marcadorEquipo1}-${this.marcadorEquipo2}`);
    }
    return coinciden;
  }

  // RN-04
  congelarPorDisputa(disputaId, usuarioId) {
    if (this.estaCerrada()) throw new AppError('El resultado ya fue validado, no se puede disputar');
    if (this.estado === EstadoPartida.EN_DISPUTA) throw new AppError('La partida ya está en disputa');
    if (this.estado !== EstadoPartida.ESPERANDO_RESULTADOS) {
      throw new AppError('Solo se puede disputar una partida que ya se jugó');
    }
    this.estado = EstadoPartida.EN_DISPUTA;
    this.disputaId = disputaId;
    this.registrarEvento('EN_DISPUTA', `Se abrió la disputa ${disputaId}`, usuarioId);
  }

  // RF-07: lo llama la Disputa al emitir el dictamen
  aplicarDictamen(ganadorId, dictamen, arbitroId) {
    if (!this.incluyeEquipo(ganadorId)) throw new AppError('El ganador debe ser uno de los dos equipos');
    this.ganadorId = Number(ganadorId);
    this.estado = EstadoPartida.AUDITADA;
    this.registrarEvento('AUDITADA', `Dictamen: ${dictamen}. Ganador: equipo ${ganadorId}`, arbitroId);
  }

  static esMarcadorValido(m1, m2) {
    const a = Number(m1);
    const b = Number(m2);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
    return Math.max(a, b) === Partida.VICTORIAS_NECESARIAS && Math.min(a, b) >= 0
      && Math.min(a, b) < Partida.VICTORIAS_NECESARIAS;
  }
}

module.exports = Partida;
