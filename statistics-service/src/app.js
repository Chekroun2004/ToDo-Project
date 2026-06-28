const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stats_db';

app.use(express.json());

// Routes
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// Connexion MongoDB avec retry
async function connectMongo(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('MongoDB connecté');
      return;
    } catch (err) {
      console.error(`Tentative ${i}/${retries} - Erreur MongoDB: ${err.message}`);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Impossible de se connecter à MongoDB. Arrêt du service.');
        process.exit(1);
      }
    }
  }
}

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Statistics-service démarré sur le port ${PORT}`);
  });
});
