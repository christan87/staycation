// netlify.js - Entry point for Netlify Function
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // For health checks
  if (path === '/.netlify/functions/netlify') {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok' }),
    };
  }

  await app.prepare();
  
  const req = {
    method: httpMethod,
    headers,
    url: path + (Object.keys(queryStringParameters || {}).length > 0 
      ? '?' + new URLSearchParams(queryStringParameters).toString() 
      : ''),
    body: body ? JSON.parse(body) : undefined,
  };
  
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      setHeader: (name, value) => {
        res.headers[name.toLowerCase()] = value;
        return res;
      },
      write: (chunk) => {
        res.body += chunk.toString();
      },
      end: (chunk) => {
        if (chunk) res.body += chunk.toString();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: res.body,
        });
      },
      writeHead: (status, headers) => {
        res.statusCode = status;
        if (headers) res.headers = { ...res.headers, ...headers };
        return res;
      },
    };
    
    try {
      handle(req, res);
    } catch (error) {
      console.error('Error handling request:', error);
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    }
  });
};
