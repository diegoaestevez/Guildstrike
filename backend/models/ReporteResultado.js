class ReporteResultado {
  constructor(capitan, equipo, marcadorPropio, marcadorRival, fecha = new Date()) {
    if (!capitan || !equipo || !Number.isInteger(marcadorPropio) || !Number.isInteger(marcadorRival)
      || marcadorPropio < 0 || marcadorRival < 0) {
      throw new Error('El reporte de resultado es inválido');
    }
    if (capitan.equipo !== equipo) {
      throw new Error('El capitán no representa al equipo reportado');
    }
    this.capitan = capitan;
    this.equipo = equipo;
    this.marcadorPropio = marcadorPropio;
    this.marcadorRival = marcadorRival;
    this.fecha = new Date(fecha);
  }
}

module.exports = ReporteResultado;
