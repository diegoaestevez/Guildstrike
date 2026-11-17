const { db, generarId } = require('../config/db');
const { EstadoEnvio } = require('./constantes');
const discordService = require('../services/discordService');

// Aviso que se manda por Discord Webhook (RF-08, RF-11)
class Notificacion {
  constructor({ destinatario, mensaje, tipo, partidaId = null }) {
    this.id = generarId();
    this.destinatario = destinatario; // ej. "Equipo A vs Equipo B"
    this.mensaje = mensaje;
    this.tipo = tipo; // PARTIDA_PROGRAMADA, RECORDATORIO, DISPUTA_ABIERTA, ...
    this.partidaId = partidaId;
    this.estadoEntrega = EstadoEnvio.PENDIENTE;
    this.intentos = 0;
    this.ultimoError = null;
    this.fechaCreacion = new Date();
    this.fechaEnvio = null;
  }

  async enviarWebhook() {
    this.intentos += 1;
    try {
      await discordService.enviarMensaje(`**[${this.tipo}]** ${this.destinatario}\n${this.mensaje}`);
      this.estadoEntrega = EstadoEnvio.ENVIADO;
      this.fechaEnvio = new Date();
      this.ultimoError = null;
    } catch (error) {
      this.registrarFallo(error.message);
    }
    return this.estadoEntrega;
  }

  // DEP-01: queda como FALLIDO para reintentar después
  registrarFallo(motivo) {
    this.estadoEntrega = EstadoEnvio.FALLIDO;
    this.ultimoError = motivo;
  }

  async reintentarEnvio() {
    if (this.estadoEntrega === EstadoEnvio.ENVIADO) return this.estadoEntrega;
    return this.enviarWebhook();
  }

  // Atajo: crea, guarda y manda de una vez
  static async enviar(datos) {
    const notificacion = new Notificacion(datos);
    db.notificaciones.push(notificacion);
    await notificacion.enviarWebhook();
    return notificacion;
  }

  // DEP-01: para llamarlo cada 15 min desde server.js
  static async reintentarFallidas() {
    const fallidas = db.notificaciones.filter((n) => n.estadoEntrega === EstadoEnvio.FALLIDO);
    for (const n of fallidas) await n.reintentarEnvio();
    return fallidas.length;
  }
}

module.exports = Notificacion;
