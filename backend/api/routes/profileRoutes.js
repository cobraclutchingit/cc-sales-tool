const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Route to analyze a LinkedIn profile
router.post('/analyze', profileController.analyzeProfile);

module.exports = router;
