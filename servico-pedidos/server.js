require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarBanco = require("./database");
const pedidoRoutes = require("./routes/pedidoRoutes");

const app = express();
app.use(cors());
app.use(express.json());

conectarBanco();

app.get("/health", (req, res) => res.json({ status: "ok", servico: "pedidos" }));
app.use("/pedidos", pedidoRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`[servico-pedidos] rodando na porta ${PORT}`));
