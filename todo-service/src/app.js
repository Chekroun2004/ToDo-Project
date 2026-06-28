const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todo_db';

app.use(express.json());

// Routes
const todosRouter = require('./routes/todos');
app.use('/api/todos', todosRouter);

// MongoDB connection with retry
function connectWithRetry() {
  console.log('Attempting MongoDB connection...');
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      console.log('Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

app.listen(PORT, () => {
  console.log(`todo-service running on port ${PORT}`);
});
