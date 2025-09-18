const db = require("../config/database");

// função para buscar os nutricionistas com paginação, retornando informações para exibição em cards no frontend.
const fetch = async (offset, limit) => {
    try {
        const selectQuery = `
            SELECT 
                u.id_usuario AS id,
                u.foto_capa AS coverPicture,
                u.foto_perfil AS profilePicture,
                u.nome AS name,
                n.foco AS focus,
                COUNT(DISTINCT r.id_receitas) AS numberOfPublishedRecipes,
                COUNT(DISTINCT a.id) AS numberOfArticlesWritten
            FROM 
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            LEFT JOIN
                receitas r ON u.id_usuario = r.id_usuario
            LEFT JOIN
                artigo a ON u.id_usuario = a.id_nutricionista
            WHERE
                u.tipo = "nutricionista"
            GROUP BY
                u.id_usuario
            ORDER BY
                u.nome ASC
            LIMIT ? OFFSET ?
        `;
        const [selectResult] = await db.query(selectQuery, [limit, offset]);

        const countQuery = `
            SELECT COUNT(*) AS totalNutritionists
            FROM
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            WHERE
                u.tipo = "nutricionista"
        `;
        const [countResult] = await db.query(countQuery);
        const totalNutritionists = countResult[0].totalNutritionists || 0;

        const nutritionists = selectResult.map(nutritionist => ({
            ...nutritionist,
            coverPicture: nutritionist.coverPicture,
            profilePicture: nutritionist.profilePicture
        }));

        return { nutritionists, totalNutritionists };
    } catch (error) {
        console.error("Erro ao buscar nutricionistas: ", error);
        throw new Error("Erro ao buscar nutricionistas no banco de dados");
    };
};

// função para pesquisar nutricionistas com base em um termo.
const search = async (term, offset, limit) => {
    try {
        const searchTerm = `%${term}%`;

        const selectQuery = `
            SELECT 
                u.id_usuario AS id,
                u.foto_capa AS coverPicture,
                u.foto_perfil AS profilePicture,
                u.nome AS name,
                n.foco AS focus,
                COUNT(DISTINCT r.id_receitas) AS numberOfPublishedRecipes,
                COUNT(DISTINCT a.id) AS numberOfArticlesWritten
            FROM 
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            LEFT JOIN
                receitas r ON u.id_usuario = r.id_usuario
            LEFT JOIN
                artigo a ON u.id_usuario = a.id_nutricionista
            WHERE
                u.tipo = "nutricionista"
                AND u.nome LIKE ?
            GROUP BY
                u.id_usuario
            LIMIT ? OFFSET ?
        `;
        const [selectResult] = await db.query(selectQuery, [searchTerm, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) AS totalSearchedNutritionists
            FROM
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            WHERE
                u.tipo = "nutricionista"
                AND u.nome LIKE ?
        `;
        const [countResult] = await db.query(countQuery, [searchTerm]);
        const totalSearchedNutritionists = countResult[0].totalSearchedNutritionists || 0;

        const nutritionists = selectResult.map(nutritionist => ({
            ...nutritionist,
            coverPicture: nutritionist.coverPicture,
            profilePicture: nutritionist.profilePicture
        }));

        return { nutritionists, totalSearchedNutritionists };
    } catch (error) {
        console.error("Erro ao pesquisar nutricionistas por termo: ", error);
        throw new Error("Erro ao pesquisar nutricionistas por termo no banco de dados.");
    };
};

/* função para ordenar nutricionistas com base nos seguintes critérios: foco em nutrição vegana, 
foco em nutrição vegetariana e foco em nutrição vegana e vegetariana */
const sort = async (order, offset, limit) => {
    try {
        let selectQuery = `
            SELECT 
                u.id_usuario AS id,
                u.foto_capa AS coverPicture,
                u.foto_perfil AS profilePicture,
                u.nome AS name,
                n.foco AS focus,
                COUNT(DISTINCT r.id_receitas) AS numberOfPublishedRecipes,
                COUNT(DISTINCT a.id) AS numberOfArticlesWritten
            FROM 
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            LEFT JOIN
                receitas r ON u.id_usuario = r.id_usuario
            LEFT JOIN
                artigo a ON u.id_usuario = a.id_nutricionista
            WHERE
                u.tipo = "nutricionista"
        `;

        if (order === "vegan") {
            selectQuery += " AND n.foco = 'vegana'";
        } else if (order === "vegetarian") {
            selectQuery += " AND n.foco = 'vegetariana'";
        } else if (order === "veganAndVegetarian") {
            selectQuery += " AND n.foco = 'vegana_e_vegetariana'";
        } else {
            throw new Error("Critério de ordenação inválido");
        };

        selectQuery += " GROUP BY u.id_usuario LIMIT ? OFFSET ?";

        const [selectResult] = await db.query(selectQuery, [limit, offset]);

        let countQuery = `
            SELECT COUNT(*) AS totalSortedNutritionists
            FROM
                usuario u
            INNER JOIN
                nutricionista n ON u.id_usuario = n.usuario_id
            WHERE
                u.tipo = "nutricionista"
        `;

        if (order === "vegan") {
            countQuery += " AND n.foco = 'vegana'";
        } else if (order === "vegetarian") {
            countQuery += " AND n.foco = 'vegetariana'";
        } else if (order === "veganAndVegetarian") {
            countQuery += " AND n.foco = 'vegana_e_vegetariana'";
        };

        const [countResult] = await db.query(countQuery);
        const totalSortedNutritionists = countResult[0].totalSortedNutritionists || 0;

        const nutritionists = selectResult.map(nutritionist => ({
            ...nutritionist,
            coverPicture: nutritionist.coverPicture,
            profilePicture: nutritionist.profilePicture
        }));

        return { nutritionists, totalSortedNutritionists };
    } catch (error) {
        console.error("Erro ao ordenar nutricionistas: ", error);
        throw error;
    };
};

module.exports = {
    fetch,
    search,
    sort
};