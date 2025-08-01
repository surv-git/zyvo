/**
 * Debug Request Middleware
 * Logs all incoming requests to help debug the 404 issue
 */

const express = require('express');
const router = express.Router();

// Middleware to log all requests
const logRequest = (req, res, next) => {
  console.log('\n🔍 DEBUG REQUEST:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('---');
  next();
};

// Catch-all route for debugging
router.use('*', logRequest, (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint hit',
    data: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    }
  });
});

module.exports = router;
