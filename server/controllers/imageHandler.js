const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Chat = require('../models/Chat');

const imageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

    //Send image to Flask AI service
    const aiServiceURL = `{env.AI_SERVICE_URL}/api/image`;
    const aiResponse = await axios.post(aiServiceURL, formData, {
      headers: formData.getHeaders(),
    });

    // Parse AI service response
    const { response, diagnosis } = aiResponse.data;

    let chat = await Chat.findOne({ user: req.user.id });
    if (!chat) {
      chat = await Chat.create({ user: req.user.id, messages: [] });
    }

    chat.messages.push({ text: '[Image uploaded]', sender: 'user' });

    chat.messages.push({ text: response, sender: 'ai' });
    await chat.save();

    res.status(200).json({ response, diagnosis });
  } catch (error) {
    console.error('Error processing image:', error.message);
    res.status(500).json({ message: 'Image analysis failed', error: error.message });
  }
};

module.exports = { imageHandler };
