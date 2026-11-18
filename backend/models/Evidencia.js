class Evidencia {
  constructor({ nombre, tipo, tamanoBytes, fechaCarga = new Date(), contenido }) {
    if (!nombre || !tipo || !Number.isInteger(tamanoBytes) || tamanoBytes < 0) {
      throw new Error('Los metadatos de evidencia son inválidos');
    }
    this.nombre = nombre;
    this.tipo = tipo;
    this.tamanoBytes = tamanoBytes;
    this.fechaCarga = new Date(fechaCarga);
    this.contenido = contenido;
  }

  validar(reglas, fechaFin) {
    const formatos = reglas.formatosEvidencia || ['image/png', 'image/jpeg'];
    const maximo = reglas.tamanoMaximoEvidenciaBytes || 5 * 1024 * 1024;
    const limiteMinutos = reglas.limiteEvidenciaMinutos || 5;
    const minutos = (this.fechaCarga.getTime() - new Date(fechaFin).getTime()) / 60000;
    if (!formatos.includes(this.tipo)) {
      throw new Error('La evidencia debe ser PNG o JPG');
    }
    if (this.tamanoBytes > maximo) {
      throw new Error('La evidencia excede el tamaño máximo permitido');
    }
    if (minutos < 0 || minutos > limiteMinutos) {
      throw new Error('La evidencia está fuera del tiempo límite');
    }
    return true;
  }
}

module.exports = Evidencia;
