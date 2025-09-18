const db = require("../config/database"); 
const { v2: cloudinary } = require("cloudinary");

// Função para criar um novo usuário
const createUser = async (dados) => {
  const { nome, email, tipo, senha } = dados;
  const sql = `INSERT INTO usuario (nome, email, tipo, senha) VALUES (?, ?, ?, ?)`;
  const resultado = await db.query(sql, [nome, email, tipo, senha]);
  return resultado[0].insertId;
};

// Função para criar um novo nutricionista
const createNutricionista = async (dados) => {
  const { nome, email, tipo, senha, crn, formacao, foco } = dados;

  const sqlUser = `INSERT INTO usuario (nome, email, tipo, senha) VALUES (?, ?, ?, ?)`;
  const resultado = await db.query(sqlUser, [nome, email, tipo, senha]);
  const usuario_id = resultado[0].insertId;

  try {
    const sqlNutri = `INSERT INTO nutricionista (usuario_id, CRN, formacao, foco) VALUES (?, ?, ?, ?)`;
    await db.query(sqlNutri, [usuario_id, crn, formacao, foco]);
    return usuario_id;
  } catch (error) {
    // Excluir usuário criado se der erro
    await db.query(`DELETE FROM usuario WHERE id_usuario = ?`, [usuario_id]);
    throw new Error("Erro ao criar nutricionista: " + error.message);
  };
};

// Função para verificar se o email já existe
const findByEmail = async (email) => {
  const sql = `SELECT * FROM usuario WHERE email = ?`;
  const [users] = await db.query(sql, [email]);
  if (!users || users.length === 0) return null;
  return users[0];
};

// Função de login
const loginUp = async (email) => {
  const sql = `SELECT id_usuario, nome, tipo, email, foto_perfil, senha FROM usuario WHERE email = ?`;
  const [users] = await db.query(sql, [email]);
  if (!users || users.length === 0) return null;
  return users[0];
};

// Buscar informações do usuário
const fetchById = async (userId) => {
  try {
    const sql = `
      SELECT
        u.id_usuario AS id,
        u.tipo AS type,
        u.foto_capa AS coverPicture,
        u.foto_perfil AS profilePicture,
        u.nome AS name,
        u.email,
        n.foco AS focus,
        n.sobre AS about,
        n.cidade AS city,
        n.uf AS state,
        n.linkedin,
        n.instagram,
        n.site AS website,
        n.telefone AS phone,
        n.CRN AS crn,
        n.formacao AS education
      FROM usuario u
      LEFT JOIN nutricionista n 
        ON u.id_usuario = n.usuario_id
      WHERE u.id_usuario = ?
    `;
    const [result] = await db.query(sql, [userId]);
    if (result.length === 0) throw new Error("Usuário não encontrado.");

    const userData = result[0];

    userData.coverPicture = userData.coverPicture;
    userData.profilePicture = userData.profilePicture;

    return { userData };
  } catch (error) {
    console.error("Erro ao buscar informações do usuário: ", error);
    throw error;
  };
};

// Buscar receitas publicadas por um usuário
const fetchPublishedRecipes = async (userId, offset, limit) => {
  try {
    const sql = `
      SELECT
        r.id_receitas AS id,
        r.imagem AS image,
        r.nome_da_receita AS title,
        r.introducao AS summary
      FROM receitas r
      WHERE r.id_usuario = ?
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(sql, [userId, limit, offset]);
    const userRecipes = rows.map(r => ({ ...r, image: r.image }));

    const countSql = `SELECT COUNT(*) AS totalUserRecipes FROM receitas WHERE id_usuario = ?`;
    const [countRows] = await db.query(countSql, [userId]);
    const totalUserRecipes = countRows[0]?.totalUserRecipes || 0;

    return { userRecipes, totalUserRecipes };
  } catch (error) {
    console.error("Erro ao buscar receitas publicadas pelo usuário: ", error);
    throw new Error("Erro ao buscar receitas publicadas pelo usuário no banco de dados.");
  };
};

// Buscar artigos publicados por um nutricionista
const fetchPublishedArticles = async (userId, offset, limit) => {
  try {
    const sql = `
      SELECT
        a.id,
        a.data_criacao AS publicationDate,
        a.id_nutricionista AS nutritionistId,
        a.titulo AS title,
        u.nome AS nutritionistName,
        u.foto_perfil AS nutritionistProfilePicture,
        n.foco AS nutritionistFocus
      FROM artigo a
      INNER JOIN usuario u 
        ON a.id_nutricionista = u.id_usuario
      INNER JOIN nutricionista n 
        ON a.id_nutricionista = n.usuario_id
      WHERE id_nutricionista = ?
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(sql, [userId, limit, offset]);
    const userArticles = rows.map(a => ({
      ...a,
      nutritionistProfilePicture: a.nutritionistProfilePicture 
    }));

    const countSql = `SELECT COUNT(*) AS totalUserArticles FROM artigo WHERE id_nutricionista = ?`;
    const [countRows] = await db.query(countSql, [userId]);
    const totalUserArticles = countRows[0]?.totalUserArticles || 0;

    return { userArticles, totalUserArticles };
  } catch (error) {
    console.error("Erro ao buscar artigos publicados pelo nutricionista: ", error);
    throw new Error("Erro ao buscar artigos publicados pelo nutricionista no banco de dados.");
  };
};

// Atualizar fotos do usuário
const updatePictures = async (data) => {
  try {
    const { profileId, userId, profilePicture, coverPicture } = data;
    if (profileId !== userId) throw new Error("Você não tem permissão para editar este perfil.");

    const [rows] = await db.query(
      "SELECT profileImagePublicId, coverImagePublicId FROM usuario WHERE id_usuario = ?",
      [userId]
    );
    const user = rows[0];

    const oldProfileId = user ? user.profileImagePublicId : null;
    const oldCoverId = user ? user.coverImagePublicId : null;

    const params = [];
    let sql = 'UPDATE usuario SET ';

    if (profilePicture) {
      sql += 'foto_perfil = ?, profileImagePublicId = ?, ';
      params.push(profilePicture, data.profilePicturePublicId); 
    };

    if (coverPicture) {
      sql += 'foto_capa = ?, coverImagePublicId = ?, ';
      params.push(coverPicture, data.coverPicturePublicId);
    };

    sql = sql.slice(0, -2) + ' WHERE id_usuario = ?';
    params.push(profileId);

    await db.query(sql, params);

    if (oldProfileId && profilePicture) {
      try { await cloudinary.uploader.destroy(oldProfileId); } catch(e){ console.error(e); }
    };

    if (oldCoverId && coverPicture) {
      try { await cloudinary.uploader.destroy(oldCoverId); } catch(e){ console.error(e); }
    };
  } catch (error) {
    console.error("Erro ao atualizar fotos do usuário: ", error);
    throw error;
  };
};

// Atualizar dados de membros comuns
const updateMember = async (data) => {
  try {
    const { profileId, userId, name, email } = data;
    if (profileId !== userId) throw new Error("Você não tem permissão para editar este perfil.");
    const sql = `UPDATE usuario SET nome = ?, email = ? WHERE id_usuario = ?`;
    await db.query(sql, [name, email, profileId]);
  } catch (error) {
    console.error("Erro ao atualizar informações do membro: ", error);
    throw error;
  };
};

// Atualizar dados de nutricionistas
const updateNutritionist = async (data) => {
  try {
    const {
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
    } = data;

    if (profileId !== userId) throw new Error("Você não tem permissão para editar este perfil.");

    const sql = `
      UPDATE usuario u
      JOIN nutricionista n 
        ON n.usuario_id = u.id_usuario
      SET 
        u.nome = ?, 
        u.email = ?, 
        n.sobre = ?, 
        n.telefone = ?, 
        n.CRN = ?, 
        n.formacao = ?, 
        n.site = ?, 
        n.foco = ?, 
        n.instagram = ?, 
        n.linkedin = ?, 
        n.uf = ?, 
        n.cidade = ?
      WHERE u.id_usuario = ?
    `;
    await db.query(
      sql, [
        name, 
        email, 
        about, 
        phone, 
        crn, 
        education, 
        website, 
        focus, 
        instagram, 
        linkedin, 
        state, 
        city, 
        profileId
      ]
    );
  } catch (error) {
    console.error("Erro ao atualizar informações do nutricionista: ", error);
    throw error;
  };
};

module.exports = {
  createUser,
  loginUp,
  findByEmail,
  createNutricionista,
  fetchById,
  fetchPublishedRecipes,
  fetchPublishedArticles,
  updatePictures,
  updateMember,
  updateNutritionist
};