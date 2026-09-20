const Produto = require("../models/Produto");

const listProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find();
    res.json(produtos);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

// >>> Endpoint pensado para o MCP: retorna só os produtos com estoque baixo
const listEstoqueBaixo = async (req, res) => {
  try {
    const produtos = await Produto.find({
      $expr: { $lte: ["$estoque", "$estoqueMinimo"] },
    });
    res.json(produtos);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const createProduto = async (req, res) => {
  try {
    const produto = new Produto(req.body);
    const novoProduto = await produto.save();
    res.status(201).json(novoProduto);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const updateProduto = async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado" });
    res.json(produto);
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const deleteProduto = async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado" });
    res.status(200).json({ mensagem: "Produto deletado com sucesso" });
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

module.exports = {
  listProdutos,
  listEstoqueBaixo,
  createProduto,
  updateProduto,
  deleteProduto,
};
