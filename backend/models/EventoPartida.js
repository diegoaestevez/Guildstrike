class EventoPartida {
  constructor(tipo, usuario, descripcion, fecha = new Date()) {
    this.tipo = tipo;
    this.usuario = usuario;
    this.descripcion = descripcion;
    this.fecha = new Date(fecha);
  }
}

module.exports = EventoPartida;
