// netlify/functions/graphql.js
const { createYoga } = require('graphql-yoga');
const { createSchema } = require('graphql-yoga');
const { parse, print } = require('graphql');
const fetch = require('node-fetch');

// This is a simple proxy function that will forward GraphQL requests to the production API
exports.handler = async (event, context) => {
  // Parse the incoming request
  const { body, headers } = event;
  
  // Get the API URL from environment variables or use a default
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://staycation-site.netlify.app/api/graphql';
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(body);
    
    // Forward the request to the GraphQL API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(headers.authorization ? { 'Authorization': headers.authorization } : {}),
        ...(headers.cookie ? { 'Cookie': headers.cookie } : {})
      },
      body: JSON.stringify(requestBody)
    });
    
    // Get the response data
    const responseData = await response.json();
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error in GraphQL function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        errors: [{ message: 'Internal Server Error' }]
      })
    };
  }
};

// Handle OPTIONS requests for CORS
exports.handler.options = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: ''
  };
};
