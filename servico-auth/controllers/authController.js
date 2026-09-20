const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registro = async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensagem: "Email já cadastrado" });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const usuario = new Usuario({
      nome,
      email,
      senha: senhaCriptografada,
      perfil,
    });

    await usuario.save();
    res.status(201).json({ mensagem: "Usuário criado com sucesso" });
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ mensagem: "Email ou senha incorretos" });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ mensagem: "Email ou senha incorretos" });
    }

    const token = jwt.sign(
      { id: usuario._id, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({ token, perfil: usuario.perfil, nome: usuario.nome });
  } catch (erro) {
    res.status(500).json({ mensagem: erro.message });
  }
};

module.exports = { registro, login };
