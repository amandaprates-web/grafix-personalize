const mongoose = require("mongoose");

const conectarBanco = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[servico-produtos] MongoDB conectado com sucesso!");
  } catch (erro) {
    console.log("[servico-produtos] Erro ao conectar ao MongoDB:", erro);
    process.exit(1);
  }
};

module.exports = conectarBanco;
