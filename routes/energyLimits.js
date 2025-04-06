const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const EnergyData = require('../models/EnergyData');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Set overall energy limits for user
router.post('/limits', auth, async (req, res) => {
  try {
    const { daily, monthly } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.energyLimit = { daily, monthly };
    await user.save();

    res.json({ message: 'Energy limits updated successfully', energyLimit: user.energyLimit });
  } catch (error) {
    res.status(500).json({ error: 'Error updating energy limits' });
  }
});

// Get user's notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Mark notifications as read
router.put('/notifications/read', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.notifications = [];

    await user.save();
    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting notifications' });
  }
});

// Get current energy usage and check limits
router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all devices for the user
    const devices = await Device.find({ userId: req.user.userId });
    const deviceIds = devices.map(device => device.deviceId);

    // Get daily consumption across all devices
    const dailyConsumption = await EnergyData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalPower: { $sum: "$power" }
        }
      }
    ]);

    // Get monthly consumption across all devices
    const monthlyConsumption = await EnergyData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPower: { $sum: "$power" }
        }
      }
    ]);

    const dailyTotal = dailyConsumption[0]?.totalPower || 0;
    const monthlyTotal = monthlyConsumption[0]?.totalPower || 0;

    let notifications = [];

    // Check daily limit
    if (user.energyLimit.daily && dailyTotal > user.energyLimit.daily) {
      notifications.push({
        message: `Daily energy limit of ${user.energyLimit.daily}W exceeded. Current total usage: ${dailyTotal.toFixed(2)}W`,
        timestamp: new Date(),
        read: false
      });
    }

    // Check monthly limit
    if (user.energyLimit.monthly && monthlyTotal > user.energyLimit.monthly) {
      notifications.push({
        message: `Monthly energy limit of ${user.energyLimit.monthly}W exceeded. Current total usage: ${monthlyTotal.toFixed(2)}W`,
        timestamp: new Date(),
        read: false
      });
    }

    if (notifications.length > 0) {
      user.notifications.push(...notifications);
      await user.save();
    }

    res.json({
      dailyUsage: dailyTotal,
      monthlyUsage: monthlyTotal,
      limits: user.energyLimit,
      notifications
    });
  } catch (error) {
    console.error('Error checking energy limits:', error);
    res.status(500).json({ error: 'Error checking energy usage' });
  }
});

module.exports = router;
