const bcrypt = require('bcryptjs');
const { generarId } = require('../config/db');
const { RolUsuario } = require('./constantes');
const AppError = require('../utils/AppError');

// Clase base: Capitán, Árbitro y Administrador heredan de aquí
class Usuario {
  constructor({ nombreCompleto, correo, contrasena, rol }) {
    if (!nombreCompleto || !correo || !contrasena) {
      throw new AppError('Nombre, correo y contraseña son obligatorios');
    }
    this.id = generarId();
    this.nombreCompleto = nombreCompleto;
    this.correo = correo.toLowerCase();
    // RNF-02: la contraseña se guarda cifrada con bcrypt
    this.contrasenaHash = bcrypt.hashSync(contrasena, 10);
    this.rol = rol;
    this.fechaRegistro = new Date();
  }

  autenticar(contrasena) {
    return bcrypt.compareSync(contrasena, this.contrasenaHash);
  }

  cambiarRol(nuevoRol) {
    if (!Object.values(RolUsuario).includes(nuevoRol)) {
      throw new AppError(`Rol inválido: ${nuevoRol}`);
    }
    this.rol = nuevoRol;
  }

  // Nunca mandamos el hash en las respuestas
  toJSON() {
    const { contrasenaHash, ...datosPublicos } = this;
    return datosPublicos;
  }
}

// Representa a su equipo: inscribe, sube evidencias, reporta marcadores
class Capitan extends Usuario {
  constructor(datos) {
    super({ ...datos, rol: RolUsuario.CAPITAN });
    this.equipoId = null;
  }

  tieneEquipo() {
    return this.equipoId !== null;
  }

  esCapitanDe(equipoId) {
    return this.equipoId === Number(equipoId);
  }
}

// Crea torneos, programa partidas y resuelve disputas
class Arbitro extends Usuario {
  constructor(datos) {
    super({ ...datos, rol: RolUsuario.ARBITRO });
    this.disputasAsignadas = [];
  }

  tomarDisputa(disputaId) {
    if (!this.disputasAsignadas.includes(disputaId)) this.disputasAsignadas.push(disputaId);
  }
}

// Da de alta/baja usuarios y configura la plataforma
class Administrador extends Usuario {
  constructor(datos) {
    super({ ...datos, rol: RolUsuario.ADMINISTRADOR });
  }
}

const clasesPorRol = {
  [RolUsuario.CAPITAN]: Capitan,
  [RolUsuario.ARBITRO]: Arbitro,
  [RolUsuario.ADMINISTRADOR]: Administrador,
};

// Fábrica: crea la subclase correcta según el rol
function crearUsuario(rol, datos) {
  const Clase = clasesPorRol[rol];
  if (!Clase) throw new AppError(`Rol inválido: ${rol}`);
  return new Clase(datos);
}

// Cambiar de rol = cambiar de subclase, así que copiamos los datos a la nueva clase
function convertirRol(usuario, nuevoRol) {
  const Clase = clasesPorRol[nuevoRol];
  if (!Clase) throw new AppError(`Rol inválido: ${nuevoRol}`);
  const convertido = Object.assign(Object.create(Clase.prototype), usuario);
  convertido.cambiarRol(nuevoRol);
  if (nuevoRol === RolUsuario.CAPITAN && convertido.equipoId === undefined) convertido.equipoId = null;
  if (nuevoRol === RolUsuario.ARBITRO && !convertido.disputasAsignadas) convertido.disputasAsignadas = [];
  return convertido;
}

module.exports = { Usuario, Capitan, Arbitro, Administrador, crearUsuario, convertirRol };
