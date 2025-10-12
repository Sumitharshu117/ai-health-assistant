const express = require('express')

const router = express.Router()
const auth = require('../middleware/auth')
const { getAllMessages, sendNewMessage } = require('../controllers/chatController')

// Get all messages for the authenticated user using auth middleware
router.get('/', auth, getAllMessages);

// Send a new message
router.post('/', auth,sendNewMessage );


module.exports = router