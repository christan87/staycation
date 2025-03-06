// netlify/functions/netlify.js
const path = require('path');

// Set the path to the Next.js app
process.env.NODE_ENV = 'production';
const nextPath = path.join(__dirname, '../../');
process.chdir(nextPath);

// Import the Next.js server handler
const { handler } = require('../../netlify.js');

// Export the handler for Netlify Functions
exports.handler = handler;
