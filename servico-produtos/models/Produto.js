const mongoose = require("mongoose");

const produtoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    preco: { type: Number, required: true },
    estoque: { type: Number, required: true, default: 0 },
    estoqueMinimo: { type: Number, required: true, default: 5 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Produto", produtoSchema);
