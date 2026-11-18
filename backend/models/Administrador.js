const Usuario = require('./Usuario');

class Administrador extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo);
    this.rol = 'ADMINISTRADOR';
    this.usuarios = [];
    this.configuracion = {
      limiteEvidenciaMinutos: 5,
      tamanoMaximoEvidenciaBytes: 5 * 1024 * 1024,
      formatosEvidencia: ['image/png', 'image/jpeg']
    };
    this.bitacora = [];
  }

  registrarUsuario(usuario) {
    if (this.usuarios.some((item) => item.id === usuario.id)) {
      throw new Error('El usuario ya está registrado');
    }
    this.usuarios.push(usuario);
    this.bitacora.push({ tipo: 'USUARIO_REGISTRADO', usuarioId: usuario.id, fecha: new Date() });
    return usuario;
  }

  actualizarConfiguracion(cambios) {
    Object.assign(this.configuracion, cambios);
    this.bitacora.push({ tipo: 'CONFIGURACION_ACTUALIZADA', fecha: new Date() });
  }

  consultarBitacora() {
    return this.bitacora.slice();
  }
}

module.exports = Administrador;