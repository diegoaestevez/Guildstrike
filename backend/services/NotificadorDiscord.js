const Notificador = require('../models/Notificador');

// R-01: es la unica clase que sabe como funciona el webhook de Discord
class NotificadorDiscord extends Notificador {
  constructor(webhook) {
    super();
    if (!webhook || typeof webhook.send !== 'function') {
      throw new Error('Se requiere un webhook de Discord compatible');
    }
    this.webhook = webhook;
  }

  enviar(mensaje) {
    return this.webhook.send(mensaje);
  }
}

module.exports = NotificadorDiscord;
