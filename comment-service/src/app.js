const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/comment_db';

app.use(express.json());

// Routes
const commentsRouter = require('./routes/comments');
app.use('/api/comments', commentsRouter);

// Connexion MongoDB avec retry
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connexion MongoDB établie');
      return;
    } catch (err) {
      console.error(`Tentative ${i}/${retries} échouée :`, err.message);
      if (i < retries) {
        console.log(`Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('Impossible de se connecter à MongoDB. Arrêt du service.');
        process.exit(1);
      }
    }
  }
}

connectWithRetry().then(() => {
  app.listen(PORT, () => {
    console.log(`comment-service démarré sur le port ${PORT}`);
  });
});
