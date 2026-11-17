// Error con código HTTP para que el manejador de errores sepa qué responder
class AppError extends Error {
  constructor(mensaje, codigoHttp = 400) {
    super(mensaje);
    this.codigoHttp = codigoHttp;
  }
}

module.exports = AppError;
