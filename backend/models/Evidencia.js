const { generarId } = require('../config/db');
const AppError = require('../utils/AppError');

// Captura de pantalla que sube un capitán como prueba del marcador
class Evidencia {
  static FORMATOS_PERMITIDOS = ['png', 'jpg', 'jpeg', 'webp']; // RN-03
  static TAMANO_MAXIMO_MB = 5; // RN-03

  constructor({ rutaArchivo, formato, tamano, subidaPor, equipoId }) {
    if (!rutaArchivo || !formato || tamano === undefined) {
      throw new AppError('La evidencia necesita ruta, formato y tamaño');
    }
    this.id = generarId();
    this.rutaArchivo = rutaArchivo;
    this.formato = String(formato).toLowerCase().replace('.', '');
    this.tamano = Number(tamano); // en MB
    this.subidaPor = subidaPor;
    this.equipoId = Number(equipoId);
    this.fechaCarga = new Date();
  }

  validarFormatoYTamano() {
    if (!Evidencia.FORMATOS_PERMITIDOS.includes(this.formato)) {
      throw new AppError(`Formato no permitido. Usa: ${Evidencia.FORMATOS_PERMITIDOS.join(', ')}`);
    }
    if (Number.isNaN(this.tamano) || this.tamano <= 0 || this.tamano > Evidencia.TAMANO_MAXIMO_MB) {
      throw new AppError(`La imagen debe pesar máximo ${Evidencia.TAMANO_MAXIMO_MB} MB`);
    }
    return true;
  }

  asociarAPartida(partida, minutosLimite) {
    this.validarFormatoYTamano();
    partida.recibirEvidencia(this, minutosLimite);
  }
}

module.exports = Evidencia;
