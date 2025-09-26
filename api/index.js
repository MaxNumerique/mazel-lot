const express = require('express');
const path = require('path');

const app = express();

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/app', express.static(path.join(__dirname, '../app')));
app.use('/algo', express.static(path.join(__dirname, '../algo')));

// Route catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;