import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '../../server/schema';
import { resolvers } from '../../server/resolvers';
import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { User } from '../../server/models/user.model';
import jwt from 'jsonwebtoken';

// Ensure MongoDB is connected
const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export default startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => {
    // Ensure database connection before processing requests
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let user = null;
    let isAuthenticated = false;

    if (token && process.env.JWT_SECRET) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        
        // Get user from database
        user = await User.findById(decoded.id);
        isAuthenticated = !!user;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    return {
      req,
      token,
      user,
      isAuthenticated,
    };
  },
});
