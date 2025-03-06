# Staycation - Property Booking Platform

A full-stack web application built with Next.js and TypeScript that allows users to browse, book, and list properties for short-term stays.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, GraphQL
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Deployment**: Netlify

## Getting Started

### Development Environment

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see `.env.example`)
4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment on Netlify

### Automatic Deployment

1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Build command: `./netlify-build.sh`
   - Publish directory: `.next`
3. Set the required environment variables in Netlify's dashboard
4. Deploy!

### Manual Deployment

To test the Netlify build process locally before deploying:

```bash
# Make the script executable
chmod +x test-netlify-build.sh

# Run the test build script
./test-netlify-build.sh
```

### Troubleshooting Netlify Deployment

If you encounter issues with Netlify deployment:

1. Check the build logs for specific errors
2. Ensure all dependencies are correctly specified in `package.json`
3. Verify that environment variables are correctly set
4. Run the local test script to identify issues before deploying

```bash
# Clean installation and build
./clean-install.sh
```

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable UI components
- `/src/graphql` - GraphQL schemas, resolvers, and client
- `/src/lib` - Utility functions and shared libraries
- `/src/models` - MongoDB models

## Build Scripts

- `netlify-build.sh` - Main build script for Netlify deployment
- `netlify-postbuild.js` - Post-build script to ensure all necessary files exist
- `test-netlify-build.sh` - Script to test the Netlify build process locally
- `clean-install.sh` - Script to perform a clean installation of dependencies

## Environment Variables

Create a `.env.local` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

For production, set these variables in your Netlify dashboard.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
