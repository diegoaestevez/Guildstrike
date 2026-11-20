// R-03: la bitácora de auditoría es su propia clase; solo ella agrega registros y entrega una copia
class Bitacora {
  #registros = [];

  registrar(tipo, datos = {}) {
    this.#registros.push({ tipo, ...datos, fecha: new Date() });
  }

  consultar() {
    return this.#registros.slice();
  }
}

module.exports = Bitacora;
