const express = require('express');
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notifications');
const { startCron } = require('./jobs/notificationCron');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notification_db';

app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Connexion MongoDB avec retry
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connecté à MongoDB (notification_db)');
      return;
    } catch (error) {
      console.error(`Tentative ${attempt}/${retries} échouée: ${error.message}`);
      if (attempt < retries) {
        console.log(`Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Impossible de se connecter à MongoDB. Arrêt.');
        process.exit(1);
      }
    }
  }
}

async function start() {
  await connectWithRetry();

  // Démarrer le cron job après la connexion MongoDB
  startCron();

  app.listen(PORT, () => {
    console.log(`Notification-service démarré sur le port ${PORT}`);
  });
}

start();
