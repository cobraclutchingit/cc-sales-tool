const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Route to analyze a client message
router.post('/analyze', messageController.analyzeMessage);

module.exports = router;
