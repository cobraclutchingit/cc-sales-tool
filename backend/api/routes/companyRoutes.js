const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Route to analyze a LinkedIn company
router.post('/analyze', companyController.analyzeCompany);

module.exports = router;
