require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarBanco = require("./database");
const produtoRoutes = require("./routes/produtoRoutes");

const app = express();
app.use(cors());
app.use(express.json());

conectarBanco();

app.get("/health", (req, res) => res.json({ status: "ok", servico: "produtos" }));
app.use("/produtos", produtoRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`[servico-produtos] rodando na porta ${PORT}`));
