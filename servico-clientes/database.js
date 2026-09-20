const mongoose = require("mongoose");

const conectarBanco = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[servico-clientes] MongoDB conectado com sucesso!");
  } catch (erro) {
    console.log("[servico-clientes] Erro ao conectar ao MongoDB:", erro);
    process.exit(1);
  }
};

module.exports = conectarBanco;
