const express = require('express');
const path = require('path');
const app = express();

// Corriger les chemins - ils doivent pointer vers le parent du dossier api
app.use(express.static(path.join(__dirname, '../public')));
app.use('/app', express.static(path.join(__dirname, '../app')));
app.use('/algo', express.static(path.join(__dirname, '../algo')));

// Route par défaut pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Pour Vercel, on exporte l'app au lieu de l'écouter directement
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;