const express = require('express');
const router = express.Router();
const { registerUser, verifyOtpAndCreateUser, verifyLogin, showCurrentUser } = require('../controllers/authController');

// 1️⃣ Route: Register - sends OTP
router.post('/register', registerUser);

// 2️⃣ Route: Verify OTP & create user
router.post('/verify-otp', verifyOtpAndCreateUser);

// 3️⃣ Route: Login
router.post('/login', verifyLogin);

// 4️⃣ Route: Get Current User
router.get('/me',showCurrentUser);

module.exports = router;
