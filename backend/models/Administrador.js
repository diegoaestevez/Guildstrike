const Usuario = require('./Usuario');
const Bitacora = require('./Bitacora');
const { LIMITE_EVIDENCIA_MINUTOS, TAMANO_MAXIMO_EVIDENCIA_BYTES, FORMATOS_EVIDENCIA } = require('../config/limitesEvidencia');
// R-03: la bitácora salió a su propia clase; Administrador solo le pide que registre (SRP)
class Administrador extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo);
    this.rol = 'ADMINISTRADOR';
    this.usuarios = [];
    this.configuracion = {
      limiteEvidenciaMinutos: LIMITE_EVIDENCIA_MINUTOS,
      tamanoMaximoEvidenciaBytes: TAMANO_MAXIMO_EVIDENCIA_BYTES,
      formatosEvidencia: [...FORMATOS_EVIDENCIA]
    };
    this.bitacora = new Bitacora();
  }

  registrarUsuario(usuario) {
    if (this.usuarios.some((item) => item.id === usuario.id)) {
      throw new Error('El usuario ya está registrado');
    }
    this.usuarios.push(usuario);
    this.bitacora.registrar('USUARIO_REGISTRADO', { usuarioId: usuario.id });
    return usuario;
  }

  actualizarConfiguracion(cambios) {
    Object.assign(this.configuracion, cambios);
    this.bitacora.registrar('CONFIGURACION_ACTUALIZADA');
  }

  consultarBitacora() {
    return this.bitacora.consultar();
  }
}

module.exports = Administrador;