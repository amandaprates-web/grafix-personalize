require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarBanco = require("./database");
const clienteRoutes = require("./routes/clienteRoutes");

const app = express();
app.use(cors());
app.use(express.json());

conectarBanco();

app.get("/health", (req, res) => res.json({ status: "ok", servico: "clientes" }));
app.use("/clientes", clienteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[servico-clientes] rodando na porta ${PORT}`));
