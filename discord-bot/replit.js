const express = require('express');
const server = express();

// Route simple pour garder le bot en vie
server.get('/', (req, res) => {
  res.send('Bot en ligne !');
});

// Démarrer le serveur web
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur web démarré pour maintenir le bot en ligne sur le port ${PORT}`);
}); 