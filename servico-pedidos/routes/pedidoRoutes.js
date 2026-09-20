const express = require("express");
const router = express.Router();
const {
  listPedidos,
  listPedidosPorStatus,
  createPedido,
  updatePedido,
  deletePedido,
} = require("../controllers/pedidoController");
const verificarToken = require("../middlewares/auth");

// >>> As 2 rotas usadas pelo servidor MCP correspondente
router.get("/", verificarToken, listPedidos);
router.get("/status/:status", verificarToken, listPedidosPorStatus);
router.post("/", verificarToken, createPedido);
router.put("/:id", verificarToken, updatePedido);
router.delete("/:id", verificarToken, deletePedido);

module.exports = router;
