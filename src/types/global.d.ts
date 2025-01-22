import { MongoClient } from 'mongodb';

declare global {
  namespace NodeJS {
    interface Global {
      _mongoClientPromise?: Promise<MongoClient>;
    }
  }
  var _mongoClientPromise: Promise<any>;
}

declare global {
  var _mongoClientPromise: Promise<any>;
}

// This file is required to prevent TypeScript errors related to global variables.
// It extends the NodeJS global namespace to include a MongoClient promise.