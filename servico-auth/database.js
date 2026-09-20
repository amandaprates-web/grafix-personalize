const mongoose = require("mongoose");

const conectarBanco = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[servico-auth] MongoDB conectado com sucesso!");
  } catch (erro) {
    console.log("[servico-auth] Erro ao conectar ao MongoDB:", erro);
    process.exit(1);
  }
};

module.exports = conectarBanco;
