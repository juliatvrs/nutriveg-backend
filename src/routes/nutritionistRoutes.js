const express = require ("express");
const Nutritionist = require("../models/Nutritionist");

const router = express.Router();

//rota para obter informações resumidas dos nutricionistas para exibição em cards no frontend.
router.get("/list", async (req, res) => {
    try {
        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { nutritionists, totalNutritionists } = await Nutritionist.fetch(offset, limit);

        return res.status(200).json({
            nutritionists,
            totalNutritionists
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao buscar nutricionistas. " });
    };
});

//rota para pesquisar nutricionistas com base em um termo.
router.get("/search/:term", async (req, res) => {
    try {
        const { term } = req.params;

        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { nutritionists, totalSearchedNutritionists } = await Nutritionist.search(term, offset, limit);

        if(!nutritionists || nutritionists.length === 0) {
            return res.status(404).json({ message: "Não existem nutricionistas com esse termo." });
        };

        return res.status(200).json({
            nutritionists,
            totalSearchedNutritionists
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao pesquisar nutricionistas por termo." });
    };
});

//rota para ordenar nutricionistas com base em um critério ("order").
router.get("/sort", async(req, res) => {
    try {
        const { order } = req.query;

        if(!order) {
            return res.status(400).json({ message: "O parâmetro 'order' é obrigatório."});
        };

        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);

        const { nutritionists, totalSortedNutritionists } = await Nutritionist.sort(order, offset, limit);

        return res.status(200).json({
            nutritionists,
            totalSortedNutritionists
        });
    } catch(error) {
        return res.status(500).json({ message: "Erro ao ordenar nutricionistas." });
    };
});

module.exports = router;