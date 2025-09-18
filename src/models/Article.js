const db = require("../config/database");
const { JSDOM } = require('jsdom');
const DOMPurify = require("dompurify");
const { v2: cloudinary } = require("cloudinary");

// cria um ambiente simulado de DOM usando o JSDOM, necessário para a execução do DOMPurify no node.js.
const window = new JSDOM('').window;

// inicializa a instância do DOMPurify com o ambiente de DOM simulado, permitindo a sanitização de conteúdo HTML.
const DOMPurifyInstance = DOMPurify(window);

// função para criar um artigo
const create = async (data) => {
    try {
        const { articleTitle, articleText, nutritionistId, articleImage, imagePublicId } = data;

        // sanitiza o conteúdo de articleText antes de salvá-lo no banco de dados
        const sanitizedArticleText = DOMPurifyInstance.sanitize(articleText);

        const insertQuery = `
            INSERT INTO artigo (
                titulo, 
                texto, 
                imagem, 
                id_nutricionista, 
                imagePublicId
            ) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const insertResult = await db.query(
            insertQuery, 
            [
                articleTitle,
                sanitizedArticleText, 
                articleImage, 
                nutritionistId, 
                imagePublicId
            ]
        );
        const articleId = insertResult[0].insertId;

        return articleId;
    } catch (error) {
        console.error("Erro ao criar artigo: ", error);
        throw new Error("Erro ao inserir artigo no banco de dados.");
    };
};

// função para buscar os artigos com paginação, retornando informações para exibição em cards no frontend.
const fetch = async (offset, limit) => {
    try {
        const selectQuery = `
            SELECT 
                a.id,
                a.data_criacao AS publicationDate,
                a.id_nutricionista AS nutritionistId,
                a.titulo AS title,
                u.nome AS nutritionistName,
                u.foto_perfil AS nutritionistProfilePicture,
                n.foco AS nutritionistFocus
            FROM 
                artigo a
            INNER JOIN 
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
            ORDER BY
                a.data_criacao DESC
            LIMIT ? OFFSET ?
        `;
        const [selectResult] = await db.query(selectQuery, [limit, offset]);

        const countQuery = "SELECT COUNT(*) AS totalArticles FROM artigo";
        const [countResult] = await db.query(countQuery);
        const totalArticles = countResult[0].totalArticles || 0;

        const articles = selectResult.map(article => ({
            ...article,
            nutritionistProfilePicture: article.nutritionistProfilePicture
        }));

        return { articles, totalArticles };
    } catch (error) {
        console.error("Erro ao buscar artigos: ", error);
        throw new Error("Erro ao buscar artigos no banco de dados.");
    };
};

// função para buscar os detalhes de um artigo pelo ID no banco de dados.
const fetchById = async (articleId) => {
    try {
        const incrementViewCountQuery = `
            UPDATE artigo 
            SET contador_visualizacoes = contador_visualizacoes + 1 
            WHERE id = ?
        `;
        await db.query(incrementViewCountQuery, [articleId]);

        const selectQuery = `
            SELECT 
                a.imagem AS image,
                a.data_criacao AS publicationDate,
                a.titulo AS title,
                a.id_nutricionista AS nutritionistId,
                a.texto AS text,
                u.nome AS nutritionistName,
                u.foto_perfil AS nutritionistProfilePicture,
                n.foco AS nutritionistFocus
            FROM 
                artigo a
            INNER JOIN
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
            WHERE
                a.id = ?
        `;
        const [selectResult] = await db.query(selectQuery, [articleId]);

        if (selectResult.length === 0) {
            throw new Error("Artigo não encontrado ou dados relacionados ausentes.");
        };

        const article = selectResult[0];

        article.image = article.image;
        article.nutritionistProfilePicture = article.nutritionistProfilePicture;

        return article;
    } catch (error) {
        console.error("Erro ao buscar detalhes do artigo: ", error);
        throw new Error("Erro ao buscar os detalhes do artigo no banco de dados");
    };
};

// função para excluir um artigo do banco de dados.
const remove = async (articleId, nutritionistId) => {
    try {
        const selectQuery = `SELECT id_nutricionista AS nutritionistId, imagePublicId FROM artigo WHERE id = ?`;
        const [selectResult] = await db.query(selectQuery, [articleId]);

        if (selectResult.length === 0) {
            throw new Error("Artigo não encontrado.");
        };

        const article = selectResult[0];

        if (article.nutritionistId !== Number(nutritionistId)) {
            throw new Error("Você não tem permissão para excluir este artigo.");
        };

        if(article.imagePublicId) {
            await cloudinary.uploader.destroy(article.imagePublicId);
        };

        const deleteQuery = "DELETE FROM artigo WHERE id = ?";
        await db.query(deleteQuery, [articleId]);

        return { message: "Artigo excluído com sucesso!" };
    } catch (error) {
        console.error("Erro ao excluir artigo: ", error);
        throw error;
    };
};

// função para pesquisar artigos com base em um termo.
const search = async (term, offset, limit) => {
    try {
        const searchTerm = `%${term}%`;

        const selectQuery = `
            SELECT 
                a.id,
                a.data_criacao AS publicationDate,
                a.id_nutricionista AS nutritionistId,
                a.titulo AS title,
                u.nome AS nutritionistName,
                u.foto_perfil AS nutritionistProfilePicture,
                n.foco AS nutritionistFocus
            FROM 
                artigo a
            INNER JOIN 
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
            WHERE 
                a.titulo LIKE ?
            LIMIT ? OFFSET ?
        `;
        const [selectResult] = await db.query(selectQuery, [searchTerm, limit, offset]);

        const countQuery = `
            SELECT COUNT(a.id) AS totalSearchedArticles
            FROM 
                artigo a
            INNER JOIN 
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
            WHERE 
                a.titulo LIKE ?
        `;
        const [countResult] = await db.query(countQuery, [searchTerm]);
        const totalSearchedArticles = countResult[0].totalSearchedArticles || 0;

        const articles = selectResult.map(article => ({
            ...article,
            nutritionistProfilePicture: article.nutritionistProfilePicture
        }));

        return { articles, totalSearchedArticles };
    } catch (error) {
        console.error("Erro ao pesquisar artigos por termo: ", error);
        throw new Error("Erro ao pesquisar artigos por termo no banco de dados.");
    };
};

// função para ordenar artigos com base nos seguintes critérios: mais recentes, mais antigos e mais acessados.
const sort = async (order, offset, limit) => {
    try {
        let selectQuery = `
            SELECT 
                a.id,
                a.data_criacao AS publicationDate,
                a.id_nutricionista AS nutritionistId,
                a.titulo AS title,
                u.nome AS nutritionistName,
                u.foto_perfil AS nutritionistProfilePicture,
                n.foco AS nutritionistFocus
            FROM 
                artigo a
            INNER JOIN 
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
        `;

        if (order === "recent") {
            selectQuery += " ORDER BY a.data_criacao DESC";
        } else if (order === "oldest") {
            selectQuery += " ORDER BY a.data_criacao ASC";
        } else if (order === "mostViewed") {
            selectQuery += " ORDER BY a.contador_visualizacoes DESC";
        } else {
            throw new Error("Critério de ordenação inválido");
        };

        selectQuery += " LIMIT ? OFFSET ?";

        const [selectResult] = await db.query(selectQuery, [limit, offset]);

        const countQuery = `
            SELECT COUNT(*) AS totalSortedArticles
            FROM
                artigo a
            INNER JOIN 
                usuario u ON a.id_nutricionista = u.id_usuario
            INNER JOIN
                nutricionista n ON a.id_nutricionista = n.usuario_id
        `;
        const [countResult] = await db.query(countQuery);
        const totalSortedArticles = countResult[0].totalSortedArticles || 0;

        const articles = selectResult.map(article => ({
            ...article,
            nutritionistProfilePicture: article.nutritionistProfilePicture
        }));

        return { articles, totalSortedArticles };
    } catch (error) {
        console.error("Erro ao ordenar artigos: ", error);
        throw error;
    };
};

module.exports = {
    create,
    fetch,
    fetchById,
    remove,
    search,
    sort
};