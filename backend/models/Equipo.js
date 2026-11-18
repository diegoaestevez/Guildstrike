// baja cohesion: aparte del roster expone comportamiento de presentacion del bracket
class Equipo {
  constructor(id, nombre, capitan) {
    if (!id || !nombre || !capitan) {
      throw new Error('id, nombre y capitán son obligatorios');
    }
    this.id = id;
    this.nombre = nombre;
    this.capitan = capitan;
    this.integrantes = [];
    capitan.asignarEquipo(this);
  }

  agregarIntegrante(integrante) {
    if (this.integrantes.length >= 9) {
      throw new Error('El roster no puede exceder 9 integrantes');
    }
    if (this.integrantes.some((item) => item.id === integrante.id)) {
      throw new Error('El integrante ya pertenece al equipo');
    }
    if (integrante.equipo && integrante.equipo !== this) {
      throw new Error('El integrante ya pertenece a otro equipo');
    }
    integrante.equipo = this;
    this.integrantes.push(integrante);
  }

  esValido() {
    return this.integrantes.length >= 4 && this.integrantes.length <= 9;
  }

  obtenerEtiquetaBracket() {
    return `${this.nombre} (${this.integrantes.length} integrantes)`;
  }
}

module.exports = Equipo;
