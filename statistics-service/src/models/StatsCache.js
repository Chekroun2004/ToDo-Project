const mongoose = require('mongoose');

const statsCacheSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now, expires: 300 }  // TTL 300 secondes
});

module.exports = mongoose.model('StatsCache', statsCacheSchema);
