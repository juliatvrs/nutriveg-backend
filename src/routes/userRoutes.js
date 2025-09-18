const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeNutritionistMiddleware = require("../middlewares/authorizeNutritionistMiddleware");
const uploadCloudinary = require("../middlewares/uploadCloudinary");

const rotas = express.Router();

rotas.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Verificar se o usuário existe
        const usuario = await User.loginUp(email);
        if (!usuario) {
            return res.status(400).send("Usuário não encontrado.");
        }

        // Verificar a senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(400).send("Senha inválida.");
        };

        // Gerar token JWT
        const token = jwt.sign(
          { 
            id: usuario.id_usuario,
            tipo: usuario.tipo, 
            nome: usuario.nome, 
            fotoPerfil: usuario.foto_perfil 
          }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: "Login bem-sucedido!" });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).send("Erro no servidor.");
    };
});

// Registro do usuário
rotas.post('/register', async (req, res) => {
  const { nome, email, senha, tipo, crn, foco, formacao } = req.body;
  if(tipo === "nutricionista"){
    if (!crn || !foco || !formacao || !nome || !email || !senha || !tipo) {
      return res.status(400).json({ message: 'Campos de nutricionista estão faltando.' });
    };
    const usuarioExistente = await User.findByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já está registrado.' });
    };
    const novoUsuario = await User.createNutricionista({
      nome,
      email,
      tipo,
      senha: await bcrypt.hash(senha, 10),
      crn,
      foco,
      formacao
    });
    return res.status(201).json({ message: 'O nutricionista foi cadastrado com sucesso' });
  } else{ 
    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ message: 'Campos de usuário estão faltando.' });
    };
    const usuarioExistente = await User.findByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já está registrado.' });
    };
    const novoUsuario = await User.createUser({
      nome,
      email,
      tipo,
      senha: await bcrypt.hash(senha, 10)
    });
    return res.status(201).json({ message: 'O nutricionista foi cadastrado com sucesso' });
  };
});  

//rota para buscar informações do usuário
rotas.get("/details/:id", async (req, res) => {
  const { id } = req.params;

  if(!id) {
    return res.status(400).json({ message: "O ID do usuário não foi fornecido."});
  };

  try {
    const { userData } = await User.fetchById(id);
    
    return res.status(200).json({ userData });
  } catch(error) {
    return res.status(500).json({ message: "Erro ao buscar informações do usuário." });
  };
});

//rota para buscar as receitas publicadas pelo usuário
rotas.get("/:id/recipes/published", async (req, res) => {
  const { id } = req.params;

  const offset = parseInt(req.query.offset);
  const limit = parseInt(req.query.limit);

  if(!id) {
    return res.status(400).json({ message: "O ID do usuário não foi fornecido."});
  };

  try {
    const { userRecipes, totalUserRecipes } = await User.fetchPublishedRecipes(id, offset, limit);
    return res.status(200).json({ userRecipes, totalUserRecipes });
  } catch(error) {
    return res.status(500).json({ message: "Erro ao buscar receitas publicadas pelo usuário." });
  };
});

rotas.get("/:id/articles/published", async (req, res) => {
  const { id } = req.params; 

  const offset = parseInt(req.query.offset);
  const limit = parseInt(req.query.limit);

  if(!id) {
    return res.status(400).json({ message: "O ID do nutricionista não foi fornecido."});
  };

  try {
    const { userArticles, totalUserArticles } = await User.fetchPublishedArticles(id, offset, limit);
    return res.status(200).json({ userArticles, totalUserArticles });
  } catch(error) {
    return res.status(500).json({ message: "Erro ao buscar artigos publicados pelo nutricionista." });
  };
});

rotas.put("/update-pictures/:profileId/:userId", authMiddleware,
  uploadCloudinary.fields([ { 
    name: "profilePicture", maxCount: 1}, { name: "coverPicture", maxCount: 1 } ]), async (req, res) => {
    const { profileId, userId } = req.params;

    if(!profileId || !userId) {
      return res.status(400).json({ message: "IDs obrigatórios não fornecidos." });
    };

    const profilePicture = req.files.profilePicture ? req.files.profilePicture[0].path : null;
    const coverPicture = req.files.coverPicture ? req.files.coverPicture[0].path : null;

    const profilePicturePublicId = req.files.profilePicture ? req.files.profilePicture[0].filename : null;
    const coverPicturePublicId= req.files.coverPicture ? req.files.coverPicture[0].filename : null;

    if(!profilePicture && !coverPicture) {
      return res.status(400).json({ message: "Imagens não fornecidas." });
    };

    try {
      await User.updatePictures(
        { 
          profileId, 
          userId, 
          profilePicture, 
          coverPicture, 
          profilePicturePublicId, 
          coverPicturePublicId 
        });

      return res.status(201).json({ message: "Sucesso ao atualizar fotos do usuário!" });
    } catch(error) {
      if(error.message === "Você não tem permissão para editar este perfil.") {
        return res.status(403).json({ error: error.message });
      };
  
      return res.status(500).json({ message: "Erro ao atualizar fotos do usuário." });
    };
});

rotas.put("/update-member/:profileId/:userId", authMiddleware,
  uploadCloudinary.fields([ { 
    name: "profilePicture", maxCount: 1}, { name: "coverPicture", maxCount: 1 } ]), async (req, res) => {
    const { profileId, userId } = req.params;

    const { name, email } = req.body;

    if(!profileId || !userId || !name || !email) {
      return res.status(400).json({ message: "Campos obrigatórios não fornecidos." });
    };

    try {
      await User.updateMember({ profileId, userId, name, email });

      return res.status(201).json({ message: "Sucesso ao atualizar informações do membro!" });
    } catch(error) {
      if(error.message === "Você não tem permissão para editar este perfil.") {
        return res.status(403).json({ error: error.message });
      };
  
      return res.status(500).json({ message: "Erro ao atualizar informações do membro." });
    };
  });

rotas.put("/update-nutritionist/:profileId/:userId", authMiddleware, authorizeNutritionistMiddleware,
uploadCloudinary.fields([ { 
  name: "profilePicture", maxCount: 1}, { name: "coverPicture", maxCount: 1 } ]), async (req, res) => {
  const { profileId, userId } = req.params;

  const {
    name,
    email,
    crn,
    education, 
    focus
  } = req.body;

  if(!profileId || !userId || !name || !email || !crn || !education || !focus) {
    return res.status(400).json({ message: "Campos obrigatórios não fornecidos." });
  };

  const sanitizeValue = (value) => (value === "null" || value === "" ? null : value);

  const about = sanitizeValue(req.body.about);
  const phone = sanitizeValue(req.body.phone);
  const website = sanitizeValue(req.body.website);
  const instagram = sanitizeValue(req.body.instagram);
  const linkedin = sanitizeValue(req.body.linkedin);
  const state = sanitizeValue(req.body.state);
  const city = sanitizeValue(req.body.city);

  try {
    await User.updateNutritionist({
      profileId,
      userId,
      about,
      name,
      email,
      phone,
      crn,
      education,
      website,
      focus,
      instagram,
      linkedin,
      state,
      city
    });

    return res.status(201).json({ message: "Sucesso ao atualizar informações do nutricionista!" });
  } catch(error) {
    if(error.message === "Você não tem permissão para editar este perfil.") {
      return res.status(403).json({ error: error.message });
    };

    return res.status(500).json({ message: "Erro ao atualizar informações do nutricionista." });
  };
});

module.exports = rotas;  