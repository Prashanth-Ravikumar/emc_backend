const express = require('express');
const Device = require('../models/Device');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Add a new device
router.post('/', async (req, res) => {
  const { name, location } = req.body;
  try {
    const device = new Device({
      userId: req.user.userId,
      name,
      location
    });
    await device.save();
    res.status(201).json(device); // Returns the device object including the generated UUID
  } catch (error) {
    res.status(500).json({ error: 'Error adding device' });
  }
});

// Get all devices for authenticated user
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.userId });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching devices' });
  }
});

// Update a device
router.put('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!device) {
      return res.status(404).json({ error: 'Device not found or unauthorized' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Error updating device' });
  }
});

// Delete a device
router.delete('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ 
      deviceId: req.params.deviceId,
      userId: req.user.userId
    });
    if (!device) {
      return res.status(404).json({ error: 'Device not found or unauthorized' });
    }
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting device' });
  }
});

module.exports = router;
