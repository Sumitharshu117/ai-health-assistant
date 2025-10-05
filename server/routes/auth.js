const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { registerUser, verifyOtpAndCreateUser } = require('../controllers/authController');

// 1️⃣ Route: Register - sends OTP
router.post('/register', registerUser);

// 2️⃣ Route: Verify OTP & create user
router.post('/verify-otp', verifyOtpAndCreateUser);

// 3️⃣ Route: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // (Optional) Enforce verified email — remove this if not storing `isVerified`
    // if (!user.isVerified) {
    //   return res.status(403).json({ message: 'Please verify your email before logging in.' });
    // }

    // Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4️⃣ Route: Get Current User
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
