const mysql = require("mysql2/promise");

//configura o pool de conexões com o banco de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    connectionLimit: 10,
});

//testa a conexão ao banco de dados
pool.query('SELECT 1')
.then(() => {
    console.log("Banco de dados conectado!");
})
.catch((erro) => {
    console.log("Falha ao conectar ao banco de dados...");
    console.log(erro);
});

//exporta o objeto pool como módulo
module.exports = pool;