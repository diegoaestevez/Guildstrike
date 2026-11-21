const path = require('path');
const dns = require('node:dns');
const dotenv = require('dotenv');

dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const { conectarBaseDatos, desconectarBaseDatos } = require('./config/database');

const app = express();
const puerto = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../frontend')));
app.use('/backend/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  const baseDatosConectada = mongoose.connection.readyState === 1;

  res.status(baseDatosConectada ? 200 : 503).json({
    estado: baseDatosConectada ? 'activo' : 'base de datos no disponible',
    baseDatos: baseDatosConectada ? 'conectada' : 'desconectada'
  });
});

async function iniciarServidor() {
  await conectarBaseDatos();

  const servidor = app.listen(puerto, () => {
    console.log(`Servidor activo en http://localhost:${puerto}`);
  });

  const cerrar = async (senal) => {
    servidor.close(async () => {
      await desconectarBaseDatos();
      console.log(`Servidor detenido por ${senal}`);
      process.exit(0);
    });
  };

  process.once('SIGINT', () => cerrar('SIGINT'));
  process.once('SIGTERM', () => cerrar('SIGTERM'));
}

if (require.main === module) {
  iniciarServidor().catch((error) => {
    console.error('No fue posible iniciar el servidor:', error.message);
    process.exit(1);
  });
}

module.exports = app;
