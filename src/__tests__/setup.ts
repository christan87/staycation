/**
 * Test Environment Setup
 * 
 * This file configures the test environment using MongoDB Memory Server.
 * It handles:
 * - Setting up an in-memory MongoDB instance for tests
 * - Managing database connections and cleanup
 * - Creating a test Apollo Server instance
 * 
 * The in-memory database ensures tests are isolated and don't affect
 * the production database.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../server/schema';
import { resolvers } from '../server/resolvers';
import { Context } from '../types/context';

// MongoDB Memory Server instance
let mongod: MongoMemoryServer;

/**
 * Setup function that runs before all tests
 * Creates and connects to an in-memory MongoDB instance
 */
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

/**
 * Cleanup function that runs after all tests
 * Closes database connections and stops the MongoDB instance
 */
afterAll(async () => {
  // Clean up the in-memory database and close connections
  await mongoose.disconnect();
  await mongod.stop();
});

/**
 * Setup function that runs before each test
 * Clears all collections to ensure test isolation
 */
beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

/**
 * Creates a new Apollo Server instance for testing
 * @returns Configured Apollo Server with GraphQL schema and resolvers
 */
export const createTestServer = () => {
  return new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });
};
