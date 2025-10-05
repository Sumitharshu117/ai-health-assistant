const express = require('express')
const Chat = require('../models/Chat')
const axios = require('axios')
const router = express.Router()
const auth = require('../middleware/auth')

// Get all messages for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ user: req.user.id })

    if (!chat) {
      // Create a new chat if none exists
      chat = await Chat.create({ user: req.user.id, messages: [] })
    }

    res.status(200).json({ messages: chat.messages })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid message format' })
    }

    // Find or create chat for the user
    let chat = await Chat.findOne({ user: req.user.id })
    if (!chat) {
      chat = await Chat.create({ user: req.user.id, messages: [] })
    }

    // Add user message to chat
    chat.messages.push({ text: message, sender: 'user' })
    await chat.save()

    // Get AI response
    const aiResponse = await getAIResponse(message)

    // Add AI response to chat
    chat.messages.push({ text: aiResponse.response, sender: 'ai' })

    // If there's a diagnosis, add it to the chat
    if (aiResponse.diagnosis) {
      chat.diagnoses.push(aiResponse.diagnosis)
    }

    await chat.save()

    res.status(200).json({
      response: aiResponse.response,
      diagnosis: aiResponse.diagnosis || null
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Helper function to get AI response
async function getAIResponse(message) {
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/api/message`, {
      message: message
    })
    return response.data
  } catch (error) {
    console.error('AI Service Error:', error.message)
    return {
      response: "I'm having trouble processing your request. Please try again later.",
      diagnosis: null
    }
  }
}

module.exports = router