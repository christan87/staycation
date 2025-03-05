#!/bin/bash

# Install dependencies
npm install

# Install the Netlify Next.js plugin and CSS processing dependencies
npm install -D @netlify/plugin-nextjs cssnano postcss autoprefixer

# Build the Next.js app
npm run build
