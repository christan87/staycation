import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('MongoDB URI is not defined');
}

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Initialize MongoDB Native client
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Initialize Mongoose connection
mongoose.connect(uri).catch(error => {
  console.error('Error connecting to MongoDB with Mongoose:', error);
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

export async function connectToDatabase() {
  const client = await clientPromise;
  return client;
}

export default clientPromise;