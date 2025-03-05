#!/bin/bash

# Install dependencies
npm install

# Install the Netlify Next.js plugin
npm install -D @netlify/plugin-nextjs

# Build the Next.js app
npm run build
