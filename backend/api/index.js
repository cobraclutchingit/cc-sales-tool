const express = require('express');
const router = express.Router();

// Import route modules
const profileRoutes = require('./routes/profileRoutes');
const companyRoutes = require('./routes/companyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const agentRoutes = require('./routes/agentRoutes');

// Register routes
router.use('/profile', profileRoutes);
router.use('/company', companyRoutes);
router.use('/message', messageRoutes);
router.use('/agent', agentRoutes);

module.exports = router;
