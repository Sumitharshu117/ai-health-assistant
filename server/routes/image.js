const express = require('express')
const multer = require('multer')

const router = express.Router()
const auth = require('../middleware/auth')
const { imageHandler } = require('../controllers/imageHandler')

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Upload image and get analysis
router.post('/', auth, upload.single('image'), imageHandler);

module.exports = router