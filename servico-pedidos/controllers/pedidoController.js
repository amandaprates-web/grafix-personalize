const Pedido = require("../models/Pedido");

const listPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

// >>> Endpoint pensado para o MCP: filtra pedidos por status (ex: "Em Produção")
const listPedidosPorStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const pedidos = await Pedido.find({ status });
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const createPedido = async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    const novoPedido = await pedido.save();
    res.status(201).json(novoPedido);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const updatePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!pedido)
      return res.status(404).json({ mensagem: "Pedido não encontrado" });
    res.json(pedido);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const deletePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido)
      return res.status(404).json({ mensagem: "Pedido não encontrado" });
    res.status(200).json({ mensagem: "Pedido deletado com sucesso" });
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

module.exports = {
  listPedidos,
  listPedidosPorStatus,
  createPedido,
  updatePedido,
  deletePedido,
};
