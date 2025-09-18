const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization'); 
    if (!authHeader) return res.status(401).send('Acesso negado. Token não fornecido.');

    const token = authHeader.split(' ')[1]; 
    if (!token) return res.status(401).send('Acesso negado. Token inválido.');

    try {
        // Verifica se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded; 
        next(); // Continua para o próximo middleware
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).send('Token expirado.');
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401).send('Token inválido.');
        } else {
            res.status(500).send('Erro ao verificar o token.');
        };
    };
};