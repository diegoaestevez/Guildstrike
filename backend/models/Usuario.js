class Usuario {
  constructor(id, nombre, correo) {
    if (new.target === Usuario) {
      throw new Error('Usuario es una clase abstracta');
    }
    if (!id || !nombre || !correo) {
      throw new Error('id, nombre y correo son obligatorios');
    }
    this.id = id;
    this.nombre = nombre;
    this.correo = correo;
    this.activo = true;
  }

  desactivar() {
    this.activo = false;
  }

}

module.exports = Usuario;
