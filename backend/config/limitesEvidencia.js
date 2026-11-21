// R-05: los límites de la evidencia tienen nombre y viven en un solo lugar
const LIMITE_EVIDENCIA_MINUTOS = 5;
const TAMANO_MAXIMO_EVIDENCIA_BYTES = 5 * 1024 * 1024; // 5 MB
const FORMATOS_EVIDENCIA = Object.freeze(['image/png', 'image/jpeg']);

module.exports = { LIMITE_EVIDENCIA_MINUTOS, TAMANO_MAXIMO_EVIDENCIA_BYTES, FORMATOS_EVIDENCIA };
