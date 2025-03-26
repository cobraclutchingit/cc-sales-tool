const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Route to analyze a LinkedIn profile
router.post('/analyze', profileController.analyzeProfile);

// Get LLM usage metrics
router.get('/metrics', profileController.getLLMMetrics);

// Clear LLM cache
router.post('/clear-cache', profileController.clearLLMCache);

module.exports = router;
