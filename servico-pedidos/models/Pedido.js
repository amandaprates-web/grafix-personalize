const mongoose = require("mongoose");

const pedidoSchema = new mongoose.Schema(
  {
    cliente: { type: String, required: true },
    descricao: { type: String, required: true },
    status: {
      type: String,
      enum: ["Orçamento", "Aprovado", "Em Produção", "Pronto", "Entregue"],
      default: "Orçamento",
    },
    valorTotal: { type: Number, required: true },
    dataEntrega: { type: Date, required: true },
    observacoes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Pedido", pedidoSchema);
