const Cliente = require("../models/Cliente");

const listClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const getCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado" });
    res.json(cliente);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const createCliente = async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    const novoCliente = await cliente.save();
    res.status(201).json(novoCliente);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado" });
    res.json(cliente);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado" });
    res.status(200).json({ mensagem: "Cliente deletado com sucesso" });
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

module.exports = {
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
};
