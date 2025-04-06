const express = require('express');
const EnergyData = require('../models/EnergyData');
const Device = require('../models/Device');
const auth = require('../middleware/auth');
const apiAuth = require('../middleware/apiAuth');

const router = express.Router();

// All routes require authentication except for data submission from ESP32
router.use('/device', auth);
router.use('/user', auth);

// Record new energy data (for ESP32)
router.post('/', apiAuth, async (req, res) => {
  const { deviceId, voltage, current, power } = req.body;
  try {
    // Verify device exists
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const energyData = new EnergyData({
      deviceId,
      voltage,
      current,
      power
    });
    await energyData.save();
    res.status(201).json(energyData);
  } catch (error) {
    res.status(500).json({ error: 'Error recording energy data' });
  }
});

// Get energy data for a specific device (authenticated)
router.get('/device/:deviceId', async (req, res) => {
  try {
    // Check if user owns the device
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.userId
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found or unauthorized' });
    }

    const data = await EnergyData.find({ 
      deviceId: req.params.deviceId 
    }).sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching energy data' });
  }
});

// Get latest energy data for a device (authenticated)
router.get('/device/:deviceId/latest', async (req, res) => {
  try {
    // Check if user owns the device
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.userId
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found or unauthorized' });
    }

    const data = await EnergyData.findOne({ 
      deviceId: req.params.deviceId 
    }).sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching latest energy data' });
  }
});

// Get total energy usage for all user devices
router.get('/user/total-usage', async (req, res) => {
  try {
    // Get all devices belonging to the user
    const userDevices = await Device.find({ userId: req.user.userId });
    const deviceIds = userDevices.map(device => device.deviceId);

    // Get energy data for all devices
    const energyData = await EnergyData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds }
        }
      },
      {
        $group: {
          _id: '$deviceId',
          totalPower: { $sum: '$power' },
          avgVoltage: { $avg: '$voltage' },
          avgCurrent: { $avg: '$current' },
          readingCount: { $sum: 1 },
          lastReading: { $last: '$$ROOT' }
        }
      }
    ]);

    // Add device details to the results
    const devicesMap = userDevices.reduce((map, device) => {
      map[device.deviceId] = device;
      return map;
    }, {});

    const enrichedData = energyData.map(data => ({
      deviceId: data._id,
      deviceName: devicesMap[data._id].name,
      deviceLocation: devicesMap[data._id].location,
      totalPower: data.totalPower,
      avgVoltage: Math.round(data.avgVoltage * 100) / 100,
      avgCurrent: Math.round(data.avgCurrent * 100) / 100,
      readingCount: data.readingCount,
      lastReading: {
        voltage: data.lastReading.voltage,
        current: data.lastReading.current,
        power: data.lastReading.power,
        timestamp: data.lastReading.timestamp
      }
    }));

    // Calculate overall totals
    const overall = {
      totalDevices: deviceIds.length,
      totalPowerUsage: enrichedData.reduce((sum, device) => sum + device.totalPower, 0),
      totalReadings: enrichedData.reduce((sum, device) => sum + device.readingCount, 0),
      devices: enrichedData
    };

    res.json(overall);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching total usage data' });
  }
});

module.exports = router;
