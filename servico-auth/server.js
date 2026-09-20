require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarBanco = require("./database");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

conectarBanco();

app.get("/health", (req, res) => res.json({ status: "ok", servico: "auth" }));
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[servico-auth] rodando na porta ${PORT}`));
