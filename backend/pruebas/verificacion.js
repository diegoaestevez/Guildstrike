// Casos de verificación de la Entrega 2.
// Se corren antes de refactorizar (v1-antes) y después de cada refactorización:
// si un resultado cambia, la refactorización alteró el comportamiento.
// Uso: node backend/pruebas/verificacion.js

const Notificacion = require('../models/Notificacion');

const resultados = [];

function caso(id, rf, tipo, entrada, esperado, prueba) {
  let cumple;
  try {
    cumple = prueba() === true;
  } catch (error) {
    cumple = false;
  }
  resultados.push({ id, rf, tipo, entrada, esperado, resultado: cumple ? 'Cumple' : 'No cumple' });
}

// Webhook de prueba: guarda lo que recibe en lugar de mandarlo a Discord.
function webhookDePrueba({ responde = true } = {}) {
  return {
    recibidos: [],
    responde,
    send(mensaje) {
      if (!this.responde) {
        throw new Error('Sin respuesta');
      }
      this.recibidos.push(mensaje);
      return true;
    }
  };
}

// RF-08: el sistema envía una notificación al programar una partida.
caso('V-08a', 'RF-08', 'Correcto',
  'Partida programada · el canal responde',
  'El aviso se envía y queda ENVIADA',
  () => {
    const webhook = webhookDePrueba();
    const aviso = new Notificacion(webhook, ['Equipo A', 'Equipo B'], 'PARTIDA_PROGRAMADA', 'Partida el 20/11 a las 18:00');
    aviso.enviarWebhook();
    return aviso.estado === 'ENVIADA' && webhook.recibidos.length === 1 && aviso.intentos === 1;
  });

caso('V-08b', 'RF-08', 'Error',
  'Partida programada · el canal no responde',
  'El aviso queda FALLIDA, se guarda el fallo y se puede reintentar',
  () => {
    const webhook = webhookDePrueba({ responde: false });
    const aviso = new Notificacion(webhook, ['Equipo A', 'Equipo B'], 'PARTIDA_PROGRAMADA', 'Partida el 20/11 a las 18:00');
    let lanzoError = false;
    try {
      aviso.enviarWebhook();
    } catch (error) {
      lanzoError = true;
    }
    const guardoElFallo = lanzoError && aviso.estado === 'FALLIDA' && aviso.fallos.length === 1;
    webhook.responde = true;
    aviso.reintentarEnvio();
    return guardoElFallo && aviso.estado === 'ENVIADA' && aviso.intentos === 2;
  });

console.table(resultados);
const fallidos = resultados.filter((r) => r.resultado !== 'Cumple').length;
console.log(`${resultados.length - fallidos} de ${resultados.length} casos cumplen`);
process.exitCode = fallidos ? 1 : 0;
