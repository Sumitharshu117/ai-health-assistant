const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');

// In-memory store for OTPs (can use Redis in prod)
const otpStore = new Map();

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, name, password, timestamp: Date.now() });

    await sendEmail(
      email,
      'Your OTP for AI Health Assistant',
      `<h3>Hello ${name},</h3>
       <p>Your OTP is: <strong>${otp}</strong></p>
       <p>This will expire in 5 minutes.</p>`
    );

    res.status(200).json({ message: 'OTP sent to email. Please verify.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOtpAndCreateUser = async (req, res) => {
  const { name, email, password, otp } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const timeDiff = (Date.now() - record.timestamp) / 1000;
  if (timeDiff > 300) {
    otpStore.delete(email);
    return res.status(400).json({ message: 'OTP expired. Please register again.' });
  }

  try {
    const user = new User({ name, email, password });
    await user.save(); // trigger pre-save hashing
    otpStore.delete(email);

    res.status(201).json({ message: 'Signup successful. Please login.' });
  } catch (err) {
    res.status(500).json({ message: 'User creation failed' });
  }
};
