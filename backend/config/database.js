const mongoose = require('mongoose');

async function conectarBaseDatos() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Falta configurar MONGO_URI');
  }

  if (uri.includes('<USUARIO>') || uri.includes('<CONTRASENA>') || uri.includes('<CLUSTER>')) {
    throw new Error('MONGO_URI contiene valores de ejemplo');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}

async function desconectarBaseDatos() {
  await mongoose.disconnect();
  console.log('MongoDB desconectado');
}

module.exports = {
  conectarBaseDatos,
  desconectarBaseDatos
};
