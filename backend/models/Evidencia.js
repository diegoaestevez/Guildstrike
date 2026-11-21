const { LIMITE_EVIDENCIA_MINUTOS, TAMANO_MAXIMO_EVIDENCIA_BYTES, FORMATOS_EVIDENCIA } = require('../config/limitesEvidencia');

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
    const formatos = reglas.formatosEvidencia || FORMATOS_EVIDENCIA;
    const maximo = reglas.tamanoMaximoEvidenciaBytes || TAMANO_MAXIMO_EVIDENCIA_BYTES;
    const limiteMinutos = reglas.limiteEvidenciaMinutos || LIMITE_EVIDENCIA_MINUTOS;
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
