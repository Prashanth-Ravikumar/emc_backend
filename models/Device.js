const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const deviceSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => uuidv4()
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
