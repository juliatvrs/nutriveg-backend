const db = require("../config/database"); // Importar a conexão com o banco de dados
const { v2: cloudinary } = require("cloudinary");

// Função para criar uma receita
const create = async (data) => {
  try {
    const { 
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
    } = data;

    const ingredienteParsed = JSON.parse(ingrediente);
    const modoDePreparoParsed = JSON.parse(modoDePreparo);

    // Inserção na tabela `receitas`
    const sqlRec = `
      INSERT INTO receitas (
        rendimento, 
        nome_da_receita, 
        introducao, 
        tempo_de_preparo, 
        alimentacao, 
        imagem, 
        id_usuario, 
        imagePublicId
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const resultado = await db.query(
      sqlRec, 
      [
        rendimento, 
        nome, 
        introducao, 
        tempo, 
        alimentacao, 
        imagem, 
        idUsuario, 
        imagePublicId
      ]
    );
    const idReceita = resultado[0].insertId;

    // Inserção nas etapas de preparo
    const sqlPrep = `INSERT INTO etapa (descricao, id_receitas) VALUES (?, ?)`;
    for (const etapa of modoDePreparoParsed) {
      await db.query(sqlPrep, [etapa.value, idReceita]);
    };

    // Inserção da categoria
    const sqlCat = `
      INSERT INTO categoria (
        cafe, 
        lanche_sobremesa, 
        almoco_jantar, 
        id_usuario, 
        id_receitas
      ) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sqlCat, [
      categoria.includes("cafe"),
      categoria.includes("lanche_sobremesa"),
      categoria.includes("almoco_jantar"),
      idUsuario,
      idReceita,
    ]);

    // Inserção nos ingredientes
    const sqlIng = `INSERT INTO ingrediente (nome, id_receitas) VALUES (?, ?)`;
    for (const item of ingredienteParsed) {
      await db.query(sqlIng, [item.value, idReceita]);
    };

    return idReceita; // Retorna o ID da receita criada
  } catch (error) {
    console.error("Erro ao criar receita:", error);
    throw new Error("Erro ao criar receita no banco de dados.");
  };
};

// Aparecer as receitas nos cards
const fetch = async (offset, limit) => {
  try {
    const sql = `
      SELECT 
        id_receitas, 
        imagem, 
        nome_da_receita, 
        introducao, 
        alimentacao 
      FROM receitas 
      ORDER BY data_criacao DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(sql, [limit, offset]);

    const countSql = "SELECT COUNT(*) AS totalRecipes FROM receitas";
    const [countRows] = await db.query(countSql);
    const totalRecipes = countRows[0].totalRecipes || 0;

    const recipes = rows.map(recipe => ({
      ...recipe,
      imagem: recipe.imagem 
    }));

    return { recipes, totalRecipes };
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
    throw new Error("Erro ao buscar receitas no banco de dados.");
  };
};

// Pegar as informações da receita
const fetchById = async (idReceita) => {
  try {
    const sqlRecipes = `SELECT * FROM receitas WHERE id_receitas = ?`;
    const [recipes] = await db.query(sqlRecipes, [idReceita]);

    if (recipes.length === 0) {
      throw new Error("Receita não encontrada.");
    };

    const recipe = recipes[0];
    const recipeId = recipe.id_receitas;
    const userId = recipe.id_usuario;

    const sqlUser = `SELECT nome, tipo, foto_perfil FROM usuario WHERE id_usuario = ?`;
    const [user] = await db.query(sqlUser, [userId]);

    if (user.length === 0) {
      throw new Error("Usuário não encontrado.");
    };

    recipe.nome_usuario = user[0]?.nome || "Usuário desconhecido";
    recipe.tipo_usuario = user[0]?.tipo; 
    recipe.foto_perfil = user[0]?.foto_perfil || null;

    const sqlCategories = `SELECT cafe, lanche_sobremesa, almoco_jantar FROM categoria WHERE id_receitas = ?`;
    const [categories] = await db.query(sqlCategories, [recipeId]);
    recipe.categoria = categories;

    const sqlSteps = `SELECT descricao FROM etapa WHERE id_receitas = ?`;
    const [steps] = await db.query(sqlSteps, [recipeId]);
    recipe.modoDePreparo = steps.map((step) => step.descricao);

    const sqlIngredients = `SELECT nome FROM ingrediente WHERE id_receitas = ?`;
    const [ingredients] = await db.query(sqlIngredients, [recipeId]);
    recipe.ingredientes = ingredients.map((ingredient) => ingredient.nome);

    recipe.imagem = recipe.imagem || null;

    const sqlManys = `SELECT COUNT(*) AS total FROM receitas WHERE id_usuario = ?`;
    const [result] = await db.query(sqlManys, [userId]);
    recipe.totalReceitasUsuario = result[0]?.total || 0;

    const countQuery = "SELECT COUNT(*) AS totalArtigos FROM artigo WHERE id_nutricionista = ?";
    const [countResult] = await db.query(countQuery, [userId]);
    recipe.quantidadeDeArtigosEscritos = countResult[0]?.totalArtigos || 0;

    const sqlRating = `SELECT SUM(nota) AS totalNota, COUNT(*) AS totalAvaliacoes FROM avaliacao WHERE id_receitas = ?;`;
    const [ratings] = await db.query(sqlRating, [idReceita]);
    recipe.avaliacoes = {
      somaAvaliacoes: Number(ratings[0]?.totalNota) || 0,
      totalAvaliacoes: Number(ratings[0]?.totalAvaliacoes) || 0
    };

    return recipe;
  } catch (error) {
    console.error("Erro ao buscar detalhes da receita:", error.message);
    throw new Error("Erro ao buscar os detalhes da receita no banco de dados.");
  };
};

// Excluir receitas
const remove = async (id_receitas, id_usuario) => {
  try {
    const sqlCheck = `SELECT id_usuario, imagePublicId FROM receitas WHERE id_receitas = ?`;
    const [result] = await db.query(sqlCheck, [id_receitas]);

    if (result.length === 0) {
      return { error: 'Receita não encontrada' };
    };

    const receita = result[0];
    if (receita.id_usuario !== Number(id_usuario)) {
      return { error: 'Você não tem permissão para excluir esta receita' };
    };

    if(receita.imagePublicId) {
      await cloudinary.uploader.destroy(receita.imagePublicId);
    };

    await db.query(`DELETE FROM categoria WHERE id_receitas = ?`, [id_receitas]);
    await db.query(`DELETE FROM etapa WHERE id_receitas = ?`, [id_receitas]);
    await db.query(`DELETE FROM ingrediente WHERE id_receitas = ?`, [id_receitas]);
    await db.query(`DELETE FROM receitas WHERE id_receitas = ?`, [id_receitas]);

    return true;
  } catch (err) {
    return err;
  };
};

// Adicionar rating
const addRating = async (idReceita, idUsuario, nota) => {
  try {
    if (nota < 1 || nota > 5) throw new Error("O rating deve estar entre 1 e 5");

    const sqlCheckRating = `SELECT * FROM avaliacao WHERE id_receitas = ? AND id_usuario = ?`;
    const [existingRating] = await db.query(sqlCheckRating, [idReceita, idUsuario]);

    if (existingRating.length > 0) {
      return { success: false, message: "Você já avaliou esta receita." };
    };

    const sqlInsertRating = `INSERT INTO avaliacao (nota, id_receitas, id_usuario) VALUES (?, ?, ?)`;
    await db.query(sqlInsertRating, [nota, idReceita, idUsuario]);
    return { success: true, message: "Rating adicionado com sucesso" };
  } catch (error) {
    console.error("Erro ao adicionar rating:", error.message);
    return { success: false, error: error.message };
  };
};

// Barra de pesquisa
const search = async (query, offset, limit) => {
  try {
    const likeQuery = `%${query}%`;

    const sql = `
      SELECT DISTINCT 
        r.id_receitas, 
        r.nome_da_receita, 
        r.introducao, 
        r.imagem, 
        r.alimentacao 
      FROM receitas r 
      LEFT JOIN ingrediente i 
        ON r.id_receitas = i.id_receitas 
      WHERE 
        r.nome_da_receita LIKE ? OR 
        r.introducao LIKE ? OR 
        i.nome LIKE ? 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(sql, [likeQuery, likeQuery, likeQuery, limit, offset]);

    const countSql = `
      SELECT COUNT(DISTINCT r.id_receitas) AS totalSearchedRecipes 
      FROM receitas r 
      LEFT JOIN ingrediente i 
        ON r.id_receitas = i.id_receitas 
      WHERE 
        r.nome_da_receita LIKE ? OR 
        r.introducao LIKE ? OR 
        i.nome LIKE ?
    `;
    const [countRows] = await db.query(countSql, [likeQuery, likeQuery, likeQuery]);
    const totalSearchedRecipes = countRows[0].totalSearchedRecipes || 0;

    const recipes = rows.map(recipe => ({
      ...recipe,
      imagem: recipe.imagem || null
    }));
    
    return { recipes, totalSearchedRecipes };
  } catch (error) {
    console.error("Erro ao buscar receitas:", error.message);
    throw new Error("Erro ao buscar receitas no banco de dados.");
  };
};

// Filtrar receitas por categorias
const filter = async (filters, offset, limit) => {
  try {
    let { categoria, alimentacao, publicadoPor } = filters;

    let sqlBase = `
      SELECT 
        r.id_receitas, 
        r.imagem, 
        r.nome_da_receita, 
        r.introducao, 
        r.alimentacao
      FROM receitas r
      LEFT JOIN categoria c 
        ON r.id_receitas = c.id_receitas
      LEFT JOIN usuario u 
        ON r.id_usuario = u.id_usuario
      WHERE 1=1
    `;

    const params = [];

    if (categoria && categoria.length > 0) {
      let categoriaConditions = categoria.map(c => {
        switch (c) {
          case 'cafe': return '(c.cafe = 1)';
          case 'lanchesESobremesas': return '(c.lanche_sobremesa = 1)';
          case 'almocoEJantar': return '(c.almoco_jantar = 1)';
          default: return '';
        }
      }).filter(cond => cond !== '').join(' OR ');

      if (categoriaConditions) sqlBase += ` AND (${categoriaConditions})`;
    };

    if (alimentacao && alimentacao.length > 0) {
      sqlBase += ` AND r.alimentacao IN (?)`;
      params.push(alimentacao);
    };

    if (publicadoPor && publicadoPor.length > 0) {
      const tipoUsuario = publicadoPor.map(tipo => (tipo === "membros" ? "membro" : "nutricionista"));
      sqlBase += ` AND u.tipo IN (?)`;
      params.push(tipoUsuario);
    };

    const sqlPaginatedRecipes = `${sqlBase} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const [rows] = await db.query(sqlPaginatedRecipes, params);

    // Contagem
    let countSql = `
      SELECT COUNT(DISTINCT r.id_receitas) AS totalFilteredRecipes 
      FROM receitas r 
      LEFT JOIN categoria c 
        ON r.id_receitas = c.id_receitas 
      LEFT JOIN usuario u 
        ON r.id_usuario = u.id_usuario 
      WHERE 1=1
    `;
    const countParams = [];

    if (categoria && categoria.length > 0) {
      let categoriaConditions = categoria.map(c => {
        switch (c) {
          case 'cafe': return '(c.cafe = 1)';
          case 'lanchesESobremesas': return '(c.lanche_sobremesa = 1)';
          case 'almocoEJantar': return '(c.almoco_jantar = 1)';
          default: return '';
        };
      }).filter(cond => cond !== '').join(' OR ');

      if (categoriaConditions) countSql += ` AND (${categoriaConditions})`;
    };

    if (alimentacao && alimentacao.length > 0) countParams.push(alimentacao);
    if (publicadoPor && publicadoPor.length > 0) {
      const tipoUsuario = publicadoPor.map(tipo => (tipo === "membros" ? "membro" : "nutricionista"));
      countParams.push(tipoUsuario);
    };

    const [countRows] = await db.query(countSql, countParams);
    const totalFilteredRecipes = countRows[0].totalFilteredRecipes || 0;

    const recipes = rows.map(recipe => ({
      ...recipe,
      imagem: recipe.imagem || null
    }));

    return { recipes, totalFilteredRecipes };
  } catch (error) {
    throw new Error("Erro ao buscar receitas no banco de dados.");
  };
};

// Filtrar receitas por ordenação
const sort = async (order, offset, limit) => {
  try {
    let sql = `
      SELECT 
        r.id_receitas, 
        r.imagem, 
        r.nome_da_receita, 
        r.introducao, 
        r.alimentacao,
        COALESCE(SUM(a.nota) / COUNT(a.nota), 0) AS media_avaliacao
      FROM receitas r
      LEFT JOIN avaliacao a 
        ON r.id_receitas = a.id_receitas
      GROUP BY r.id_receitas 
    `;

    if (order === "recent") sql += " ORDER BY r.id_receitas DESC";
    else if (order === "oldest") sql += " ORDER BY r.id_receitas ASC";
    else if (order === "bestRated") sql += " ORDER BY media_avaliacao DESC";
    else throw new Error("Critério de ordenação inválido.");

    sql += " LIMIT ? OFFSET ?";

    const [recipes] = await db.query(sql, [limit, offset]);

    const countSql = `
      SELECT COUNT(*) AS totalSortedRecipes 
      FROM (
        SELECT 
          r.id_receitas 
        FROM receitas r
        LEFT JOIN avaliacao a 
          ON r.id_receitas = a.id_receitas 
        GROUP BY r.id_receitas
      ) AS subquery
    `;
    const [countRows] = await db.query(countSql);
    const totalSortedRecipes = countRows[0].totalSortedRecipes || 0;

    const formattedRecipes = recipes.map(recipe => ({
      id_receitas: recipe.id_receitas,
      imagem: recipe.imagem || null,
      nome_da_receita: recipe.nome_da_receita,
      introducao: recipe.introducao,
      alimentacao: recipe.alimentacao
    }));

    return { recipes: formattedRecipes, totalSortedRecipes};
  } catch (error) {
    console.error("Erro ao ordenar receitas:", error);
    throw new Error("Erro ao buscar receitas ordenadas no banco de dados.");
  };
};

const recentByNutritionists = async (offset, limit) => {
  try {
    const selectQuery = `
      SELECT
        r.id_receitas AS id,
        r.nome_da_receita AS title,
        r.imagem AS image
      FROM
        receitas r
      INNER JOIN usuario u 
        ON r.id_usuario = u.id_usuario
      WHERE
        u.tipo = "nutricionista"
      ORDER BY
        r.data_criacao DESC
      LIMIT ? OFFSET ?
    `;
    const [selectResult] = await db.query(selectQuery, [limit, offset]);

    const recentNutritionistsRecipes = selectResult.map(recentNutritionistsRecipe => ({
      ...recentNutritionistsRecipe,
      image: recentNutritionistsRecipe.image || null
    }));

    return { recentNutritionistsRecipes };
  } catch(error) {
    console.error("Erro ao buscar as receitas mais recentes publicadas por nutricionistas: ", error);
    throw new Error("Erro ao buscar as receitas mais recentes publicadas por nutricionistas no banco de dados.");
  };
};

module.exports = {
  create,
  fetch,
  fetchById,
  remove,
  addRating,
  search,
  filter,
  sort,
  recentByNutritionists
};