// R-01: ya no conoce a Discord, recibe cualquier notificador (DIP)
class Notificacion {
  constructor(notificador, destinatarios, tipo, contenido) {
    if (!notificador || typeof notificador.enviar !== 'function') {
      throw new Error('Se requiere un notificador compatible');
    }
    this.notificador = notificador;
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
      const resultado = this.notificador.enviar({
        destinatarios: this.destinatarios,
        tipo: this.tipo,
        contenido: this.contenido
      });
      this.estado = 'ENVIADA';
      return resultado;
    } catch (error) {
      this.estado = 'FALLIDA';
      this.fallos.push({ fecha: new Date(), mensaje: error.message });
      throw new Error(`Falló el envío de la notificación: ${error.message}`);
    }
  }

  reintentarEnvio() {
    return this.enviarWebhook();
  }
}

module.exports = Notificacion;
