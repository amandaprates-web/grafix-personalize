const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefone: { type: String, required: true },
    endereco: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cliente", clienteSchema);
