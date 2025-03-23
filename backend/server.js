const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./api');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors()); // Simplified CORS setup
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit

// Health check route
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({ status: 'ok', message: 'VigilantEx Sales Automation API is running' });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Set port
const PORT = process.env.PORT || 5007;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at http://localhost:${PORT}`);
});

module.exports = app;
