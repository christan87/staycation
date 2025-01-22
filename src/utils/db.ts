import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MongoDB URI is not defined');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  const client = await clientPromise;
  return client;
}