// alto acoplamiento: conoce directamente la forma concreta de un webhook de Discord
class Notificacion {
  constructor(discordWebhook, destinatarios, tipo, contenido) {
    if (!discordWebhook || typeof discordWebhook.send !== 'function') {
      throw new Error('Se requiere un webhook de Discord compatible');
    }
    this.discordWebhook = discordWebhook;
    this.destinatarios = destinatarios;
    this.tipo = tipo;
    this.contenido = contenido;
    this.estado = 'PENDIENTE';
    this.intentos = 0;
    this.fallos = [];
  }

  enviarWebhook() {
    this.intentos += 1;
    try {
      const resultado = this.discordWebhook.send({
        destinatarios: this.destinatarios,
        tipo: this.tipo,
        contenido: this.contenido
      });
      this.estado = 'ENVIADA';
      return resultado;
    } catch (error) {
      this.estado = 'FALLIDA';
      this.fallos.push({ fecha: new Date(), mensaje: error.message });
      throw new Error(`Falló el webhook de Discord: ${error.message}`);
    }
  }

  reintentarEnvio() {
    return this.enviarWebhook();
  }
}

module.exports = Notificacion;
