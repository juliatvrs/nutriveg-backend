const express = require("express");
const Article = require("../models/Article");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeNutritionistMiddleware = require("../middlewares/authorizeNutritionistMiddleware");
const uploadCloudinary = require("../middlewares/uploadCloudinary");

const router = express.Router();

//rota para inserir o artigo no banco de dados.
router.post(
    "/create", 
    authMiddleware, 
    authorizeNutritionistMiddleware, 
    uploadCloudinary.single("articleImage"), 
    async (req, res) => {
        
    const { articleTitle, articleText, nutritionistId } = req.body;

    const articleImage = req.file ? req.file.path : null;
    const imagePublicId = req.file ? req.file.filename : null;

    if (!articleTitle || !articleText || !nutritionistId || !articleImage) {
        return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
    };

    try {
        const articleId = await Article.create({
            articleTitle,
            articleText,
            nutritionistId,
            articleImage,
            imagePublicId
        });

        return res.status(201).json({ message: "Artigo criado com sucesso!", articleId });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao criar artigo." });
    };
});

//rota para obter informações resumidas dos artigos para exibição em cards no frontend.
router.get("/list", async (req, res) => {
    try {
        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { articles, totalArticles } = await Article.fetch(offset, limit);

        return res.status(200).json({
            articles,
            totalArticles
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao buscar artigos." });
    };
});

//rota para obter informações detalhadas de um artigo pelo ID.
router.get("/details/:id", async (req, res) => {
    const { id } = req.params;

    if(!id) {
        return res.status(400).json({ error: 'ID do artigo não fornecido.' });
    };

    try {
        const articleDetails = await Article.fetchById(id);
        return res.status(200).json({ articleDetails} );
    } catch(error) {
        return res.status(500).json({ message: "Erro ao buscar detalhes do artigo." });
    };
});

//rota para excluir um artigo.
router.delete(
    "/delete/:articleId/:nutritionistId", 
    authMiddleware, 
    authorizeNutritionistMiddleware, 
    async (req, res) => {
        
    const { articleId, nutritionistId } = req.params;
    try {
        const removeResult = await Article.remove(articleId, nutritionistId);
        return res.status(200).json(removeResult);
    } catch(error) {
        if(error.message === "Artigo não encontrado.") {
            return res.status(404).json({ error: error.message });
        };

        if(error.message === "Você não tem permissão para excluir este artigo.") {
            return res.status(403).json({ error: error.message });
        };

        return res.status(500).json({ error: "Erro ao excluir artigo." });
    };
});

//rota para pesquisar artigos com base em um termo.
router.get("/search/:term", async(req, res) => {
    try {
        const { term } = req.params;

        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { articles, totalSearchedArticles } = await Article.search(term, offset, limit);

        if (!articles || articles.length === 0) {
            return res.status(404).json({ message: "Não existem artigos com esse termo." });
        };

        return res.status(200).json({
            articles,
            totalSearchedArticles
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao pesquisar artigos por termo." });
    };
});

//rota para ordenar artigos com base em um critério ("order").
router.get("/sort", async (req, res) => {
    try {
        const { order } = req.query;

        if(!order) {
            return res.status(400).json({ message: "O parâmetro 'order' é obrigatório." });
        };

        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { articles, totalSortedArticles } = await Article.sort(order, offset, limit);

        return res.status(200).json({
            articles,
            totalSortedArticles
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao ordenar artigos. "});
    };
});

module.exports = router;