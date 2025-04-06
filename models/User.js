const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  energyLimit: {
    daily: { type: Number, default: null },
    monthly: { type: Number, default: null }
  },
  notifications: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model('User', userSchema);
