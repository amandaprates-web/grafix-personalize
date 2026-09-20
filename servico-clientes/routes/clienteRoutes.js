const express = require("express");
const router = express.Router();
const {
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clienteController");
const verificarToken = require("../middlewares/auth");

// >>> As 2 rotas usadas pelo servidor MCP correspondente: GET / e GET /:id
router.get("/", verificarToken, listClientes);
router.get("/:id", verificarToken, getCliente);
router.post("/", verificarToken, createCliente);
router.put("/:id", verificarToken, updateCliente);
router.delete("/:id", verificarToken, deleteCliente);

module.exports = router;
