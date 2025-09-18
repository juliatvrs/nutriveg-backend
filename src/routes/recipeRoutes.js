const express = require('express');
const Recipe = require('../models/Recipe');
const authMiddleware = require("../middlewares/authMiddleware");
const uploadCloudinary = require("../middlewares/uploadCloudinary");

const rotas = express.Router();

// Rota para registrar a receita no banco
rotas.post('/create', authMiddleware, uploadCloudinary.single('imagem'), async (req, res) => {
  const { 
    categoria, 
    alimentacao, 
    tempo, 
    rendimento, 
    nome, 
    introducao, 
    ingrediente, 
    modoDePreparo, 
    idUsuario 
  } = req.body;

  const imagem = req.file ? req.file.path : null;
  const imagePublicId = req.file ? req.file.filename : null;

  if (
    !categoria || 
    !alimentacao || 
    !tempo || 
    !rendimento || 
    !nome || 
    !introducao || 
    !ingrediente || 
    !modoDePreparo || 
    !idUsuario
  ) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  };

  try {
    const idReceita = await Recipe.create({ 
      rendimento, 
      nome, 
      introducao, 
      tempo, 
      categoria, 
      alimentacao, 
      imagem,
      imagePublicId,
      idUsuario, 
      modoDePreparo, 
      ingrediente 
    });

    return res.status(201).json({ message: "Receita criada com sucesso!", idReceita });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao registrar receita.' });
  };
});

// Rota para pegar as informações básicas de receitas para mostrar nos cards
rotas.get('/list', async (req, res) => {
  try {
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const { recipes, totalRecipes } = await Recipe.fetch(offset, limit);
    return res.status(200).json({
      recipes,
      totalRecipes
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar receitas.' });
  };
});

// Rota para voltar receitas individuais do banco
rotas.get('/details/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; 

  if (!id) {
    return res.status(400).json({ error: 'ID da receita não fornecido.' });
  }

  try {
    const receitaDetalhada = await Recipe.fetchById(id, userId);
    res.status(200).json(receitaDetalhada);
  } catch (error) {
    console.error("Erro na rota /receitas/:id:", error.message);
    res.status(500).json({ error: error.message });
  };
});

// Rota para excluir receita
rotas.delete('/delete/:id/:id_usuario', authMiddleware, async (req, res) => {
  const { id, id_usuario } = req.params;
  try {
    const excludes = await Recipe.remove(id, id_usuario);
    res.status(200).json(excludes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  };
});

// Rota para receber as avaliações
rotas.post('/rate', authMiddleware, async (req, res) => {
  try {
    const { nota, idUsuario, idReceita } = req.body;

    if (!nota || !idUsuario || !idReceita) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
    };

    const response = await Recipe.addRating(idReceita, idUsuario, nota);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao adicionar o rating:", error.message);
    return res.status(500).json({ error: error.message });
  };
});

// Rota para busca
rotas.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const { recipes, totalSearchedRecipes } = await Recipe.search(term, offset, limit);

    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ message: "Não existem receitas com esse termo" });
    };

    return res.status(200).json({
      recipes,
      totalSearchedRecipes
    });
  } catch (error) {
    console.error("Erro ao buscar receitas:", error.message);
    res.status(500).json({ error: "Erro ao buscar receitas na barra de busca." });
  };
});

// Filtrar receita por categoria
rotas.get("/filter", async (req, res) => {
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const { recipes, totalFilteredRecipes } = await Recipe.filter(filters, offset, limit);

    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ success: false, message: "Não existem receitas com esses filtros" });
    };

    return res.status(200).json({
      recipes,
      totalFilteredRecipes
    });
  } catch (error) {
    console.error("Erro na pesquisa por categoria:", error);
    res.status(500).json({ error: "Erro ao buscar receitas por categoria." });
  };
});

// Filtrar receitas pelos filtros
rotas.get('/sort', async (req, res) => {
  try {
    const { order } = req.query;
    if (!order) {
      return res.status(400).json({ error: "Parâmetro 'order' é obrigatório." });
    };

    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const { recipes, totalSortedRecipes } = await Recipe.sort(order, offset, limit);
    return res.status(200).json({
      recipes,
      totalSortedRecipes
    });
  } catch (error) {
    console.error("Erro na rota de ordenação:", error.message);
    res.status(500).json({ error: "Erro ao ordenar receitas." });
  };
});

rotas.get("/recent-by-nutritionists", async (req, res) => {
  try {
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const { recentNutritionistsRecipes } = await Recipe.recentByNutritionists(offset, limit);

    return res.status(200).json({ recentNutritionistsRecipes });
  } catch(error) {
    return res.status(500).json({ message: "Erro ao buscar as receitas mais recentes publicadas por nutricionistas." });
  };
});

module.exports = rotas;