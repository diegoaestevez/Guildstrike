// R-01: interfaz para los avisos, Notificacion ya no depende de Discord sino de esta clase (DIP)
class Notificador {
  enviar(mensaje) {
    throw new Error('Notificador.enviar() debe implementarse');
  }
}

module.exports = Notificador;
