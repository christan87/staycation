import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../server/schema';
import { resolvers } from '../server/resolvers';
import { Context } from '../types/context';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clean up the in-memory database and close connections
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Create a test Apollo Server instance
export const createTestServer = () => {
  return new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });
};
