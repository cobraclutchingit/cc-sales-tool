/**
 * Agent Routes
 * 
 * Routes for the two-agent system
 */

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

/**
 * @route POST /api/agent/generate
 * @desc Generate personalized content using the two-agent system
 * @access Public
 */
router.post('/generate', agentController.generateContent);

/**
 * @route POST /api/agent/test-fine-tuning
 * @desc Test the fine-tuning agent separately
 * @access Public
 */
router.post('/test-fine-tuning', agentController.testFineTuningAgent);

/**
 * @route POST /api/agent/test-sales-copy
 * @desc Test the sales copy agent separately
 * @access Public
 */
router.post('/test-sales-copy', agentController.testSalesCopyAgent);

module.exports = router;