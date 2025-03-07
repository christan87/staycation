// netlify/functions/auth.js
const fetch = require('node-fetch');

// This function will proxy authentication requests to the NextAuth API
exports.handler = async (event, context) => {
  // Parse the incoming request
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // Extract the NextAuth path from the request path
  const nextAuthPath = path.replace('/.netlify/functions/auth', '');
  
  // Get the API URL from environment variables or use a default
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://staycation-site.netlify.app';
  const apiUrl = `${baseUrl}/api/auth${nextAuthPath}`;
  
  try {
    // Build query string from parameters
    const queryString = Object.keys(queryStringParameters || {})
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryStringParameters[key])}`)
      .join('&');
    
    // Append query string to URL if it exists
    const url = queryString ? `${apiUrl}?${queryString}` : apiUrl;
    
    // Forward the request to the NextAuth API
    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(headers.cookie ? { 'Cookie': headers.cookie } : {}),
        ...(headers.authorization ? { 'Authorization': headers.authorization } : {})
      },
      ...(body ? { body } : {})
    });
    
    // Get the response data
    const responseText = await response.text();
    let responseData;
    
    try {
      // Try to parse as JSON
      responseData = JSON.parse(responseText);
    } catch (e) {
      // If not JSON, use as is
      responseData = responseText;
    }
    
    // Extract cookies from response headers
    const cookies = response.headers.raw()['set-cookie'] || [];
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        ...(cookies.length > 0 ? { 'Set-Cookie': cookies } : {})
      },
      body: typeof responseData === 'string' ? responseData : JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error in Auth function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal Server Error'
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: ''
  };
};
