const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

/**
 * @route POST /api/messages/analyze
 * @desc Analyze client message to identify topics, sentiment, and questions
 * @access Public
 */
router.post('/analyze', messageController.analyzeMessage);

/**
 * @route POST /api/messages/generate-response
 * @desc Generate a response to a client message
 * @access Public
 */
router.post('/generate-response', messageController.generateResponse);

/**
 * @route POST /api/messages/warm-followup
 * @desc Generate a warm follow-up email after a phone call
 * @access Public
 */
router.post('/warm-followup', messageController.generateWarmFollowup);

module.exports = router;
