const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Import auth middleware

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  
  try {
    // Check for existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email: email.toLowerCase(),
      username, 
      password: hashedPassword 
    });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' });
    res.json({ token, username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  console.log('Attempting password change for user:', req.user.userId);
  
  try {
    // Get user from database
    const user = await User.findById(req.user.userId);
    console.log('Found user:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    console.log('Verifying current password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('Password match:', isMatch ? 'yes' : 'no');
    
    if (!isMatch) {
      console.log('Current password is incorrect');
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    console.log('Updating password');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated successfully');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

module.exports = router;
