//middleware que verifica se o usuário é um nutricionista.
function authorizeNutritionistMiddleware(req, res, next) {
    if(req.user.tipo !== "nutricionista") {
        return res.status(403).json({ 
            message: "Acesso negado! Apenas nutricionistas têm permissão para realizar esta ação." 
        });
    };

    next();
};

module.exports = authorizeNutritionistMiddleware;