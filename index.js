const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
require('dotenv').config();


// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const energyDataRoutes = require('./routes/energyData');
const energyLimitRoutes = require('./routes/energyLimits');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/energy-data', energyDataRoutes);
app.use('/api/energy-limits', energyLimitRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
