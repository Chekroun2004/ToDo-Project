const cron = require('node-cron');
const axios = require('axios');
const Notification = require('../models/Notification');

const NGINX_URL = process.env.NGINX_URL || 'http://nginx';

async function checkOverdueTodos() {
  try {
    const response = await axios.get(`${NGINX_URL}/api/todos/overdue`);
    if (!response.data.success) return;

    const todos = response.data.data;

    for (const todo of todos) {
      const now = new Date();
      const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;

      let type = 'overdue';
      if (dueDate && dueDate > now) {
        type = 'due_soon';
      }

      // Vérifier si une notification non lue de même type existe déjà
      const existing = await Notification.findOne({
        todoId: todo._id.toString(),
        type,
        isRead: false
      });

      if (!existing) {
        await Notification.create({
          userId: todo.userId,
          todoId: todo._id.toString(),
          todoTitle: todo.title,
          type,
        });
        console.log(`Notification créée pour todo: ${todo.title}`);
      }
    }
  } catch (error) {
    console.error('Erreur cron notification:', error.message);
  }
}

function startCron() {
  // Toutes les heures
  cron.schedule('0 * * * *', checkOverdueTodos);
  console.log('Cron job notifications démarré (toutes les heures)');
}

module.exports = { startCron, checkOverdueTodos };
