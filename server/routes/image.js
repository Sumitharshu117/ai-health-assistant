const express = require('express')
const multer = require('multer')
const Chat = require('../models/Chat')
const router = express.Router()
const auth = require('../middleware/auth')

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Upload image and get analysis
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' })
    }

    // In a real application, you would send this to your AI service for analysis
    // For this example, we'll just return a mock response

    // Find or create chat for the user
    let chat = await Chat.findOne({ user: req.user.id })
    if (!chat) {
      chat = await Chat.create({ user: req.user.id, messages: [] })
    }

    // Add user message to chat
    chat.messages.push({
      text: '[Image uploaded]',
      sender: 'user'
    })

    // Mock AI response for image analysis
    const aiResponse = "I've received your image. In a real implementation, I would analyze it for medical conditions."

    // Add AI response to chat
    chat.messages.push({ text: aiResponse, sender: 'ai' })
    await chat.save()

    res.status(200).json({
      response: aiResponse,
      diagnosis: null
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router