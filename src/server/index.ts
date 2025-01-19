// Import required dependencies
import express from 'express';                                    // Web framework for Node.js
import { ApolloServer } from '@apollo/server';                   // GraphQL server
import { expressMiddleware } from '@apollo/server/express4';      // Apollo middleware for Express
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';  // Helps gracefully shut down server
import http from 'http';                                         // Node's HTTP server
import cors from 'cors';                                         // Enable Cross-Origin Resource Sharing
import { json } from 'body-parser';                              // Parse JSON request bodies
import dotenv from 'dotenv';                                     // Load environment variables
import mongoose from 'mongoose';                                 // MongoDB ODM
import { typeDefs } from './schema';                            // GraphQL schema
import { resolvers } from './resolvers';                        // GraphQL resolvers

// Define the shape of our context (data available to all resolvers)
interface MyContext {
  token?: string;                                               // Will store JWT token for auth
}

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();

// Create HTTP server using Express app
const httpServer = http.createServer(app);

// Create Apollo Server instance
const server = new ApolloServer<MyContext>({
  typeDefs,                                                     // Our GraphQL schema
  resolvers,                                                    // Our resolver functions
  plugins: [
    // Plugin to properly close server connections
    ApolloServerPluginDrainHttpServer({ httpServer })
  ],
});

// Function to connect to MongoDB
async function connectDB() {
  try {
    // Get MongoDB URI from environment variables
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staycation';
    
    // Validate that URI exists
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    // Log any connection errors and exit
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);  // Exit with error code
  }
}

// Main function to start the server
async function startServer() {
  try {
    // First connect to MongoDB
    await connectDB();

    // Start the Apollo Server
    await server.start();

    // Create a router for GraphQL endpoints
    const router = express.Router();

    // Apply middleware to router
    router.use(
      cors(),                                                   // Enable CORS for all requests
      json(),                                                   // Parse JSON bodies
      expressMiddleware(server, {
        // Context function - runs on every request
        context: async ({ req }) => ({
          // Pass authorization token to resolvers
          token: req.headers.authorization
        }),
      })
    );

    // Mount the GraphQL router at /graphql
    app.use('/graphql', router);

    // Get port from environment variables or use 4000 as default
    const PORT = process.env.PORT || 4000;
    
    // Start the server listening on specified port
    await new Promise<void>((resolve) => 
      httpServer.listen({ port: PORT }, resolve)
    );

    // Log success message
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  } catch (error) {
    // Log any server startup errors and exit
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server and handle any errors
startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
