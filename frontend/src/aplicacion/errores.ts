// Los dos errores que puede devolver cualquier puerto. La interfaz solo conoce estos dos:
// no sabe si detrás hubo un fetch o un arreglo en memoria.

/** El dominio rechazó la operación. `message` es el texto literal del modelo o de la API. */
export class ErrorDeRegla extends Error {
  /** Código HTTP equivalente: 400 regla, 403 permiso, 404 no existe. */
  readonly codigo: number

  constructor(mensaje: string, codigo = 400) {
    super(mensaje)
    this.name = 'ErrorDeRegla'
    this.codigo = codigo
  }
}

/** La fuente de datos no respondió o respondió algo que no es del contrato. */
export class ErrorDeConexion extends Error {
  constructor(mensaje = 'No fue posible conectar con el servidor') {
    super(mensaje)
    this.name = 'ErrorDeConexion'
  }
}
