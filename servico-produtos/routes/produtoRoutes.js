const express = require("express");
const router = express.Router();
const {
  listProdutos,
  listEstoqueBaixo,
  createProduto,
  updateProduto,
  deleteProduto,
} = require("../controllers/produtoController");
const verificarToken = require("../middlewares/auth");

// >>> As 2 rotas usadas pelo servidor MCP correspondente
router.get("/", verificarToken, listProdutos);
router.get("/estoque-baixo", verificarToken, listEstoqueBaixo);
router.post("/", verificarToken, createProduto);
router.put("/:id", verificarToken, updateProduto);
router.delete("/:id", verificarToken, deleteProduto);

module.exports = router;
