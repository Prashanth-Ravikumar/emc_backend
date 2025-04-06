const mongoose = require('mongoose');

const energyDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  voltage: { type: Number, required: true },
  current: { type: Number, required: true },
  power: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EnergyData', energyDataSchema);
