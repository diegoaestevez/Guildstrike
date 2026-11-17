// Envío de mensajes al canal del torneo por Discord Webhooks.
// La URL se lee de la variable de entorno DISCORD_WEBHOOK_URL (.env)

async function enviarMensaje(contenido) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error('No hay DISCORD_WEBHOOK_URL configurada');

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: contenido }),
  });

  if (!respuesta.ok) throw new Error(`Discord respondió ${respuesta.status}`);
  return true;
}

module.exports = { enviarMensaje };
