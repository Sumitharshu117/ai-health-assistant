const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// In-memory store for OTPs (can use Redis in prod)
const otpStore = new Map();

const registerUser = async (req, res) => {
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

const verifyOtpAndCreateUser = async (req, res) => {
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

const verifyLogin=async (req, res) => {
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
}
const showCurrentUser= async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports={verifyLogin,verifyOtpAndCreateUser,registerUser,showCurrentUser};