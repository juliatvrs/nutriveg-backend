const express = require('express');
const cors = require('cors');
const routes = require("./routes/index");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.use(routes);

module.exports = app;