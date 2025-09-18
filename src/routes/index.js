const express = require("express");
const router = express.Router();

const articleRoutes = require("./articleRoutes")
const nutritionistRoutes = require("./nutritionistRoutes");
const recipeRoutes = require("./recipeRoutes");
const userRoutes = require("./userRoutes");

router.use("/articles", articleRoutes);
router.use("/nutritionists", nutritionistRoutes);
router.use("/recipes", recipeRoutes);
router.use("/users", userRoutes);

module.exports = router;