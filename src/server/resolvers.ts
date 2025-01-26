/**
 * GraphQL Resolvers
 * 
 * This file contains all GraphQL resolvers for the application.
 * It handles:
 * - User authentication (register, login)
 * - User queries (me, user, users)
 * - Property management (to be implemented)
 * - Booking management (to be implemented)
 * - Review management (to be implemented)
 */

import { User } from './models/user.model';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/auth';

/**
 * Context interface for resolver functions
 */
interface Context {
  user: any;
  isAuthenticated: boolean;
  token: string | null;
  req: any;
}

/**
 * Input type for user registration
 */
interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Input type for user login
 */
interface LoginInput {
  email: string;
  password: string;
}

export const resolvers = {
  Query: {
    /**
     * Returns the currently authenticated user
     * @throws {GraphQLError} If user is not authenticated
     */
    me: async (_: any, __: any, context: Context) => {
      if (!context.isAuthenticated) {
        throw new GraphQLError('Not authenticated');
      }
      const user = await User.findById(context.user.id);
      if (!user) {
        throw new GraphQLError('User not found');
      }
      return user;
    },

    /**
     * Returns a specific user by ID (admin only)
     * @throws {GraphQLError} If user is not authenticated or not an admin
     */
    user: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.isAuthenticated || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized');
      }
      return await User.findById(id);
    },

    /**
     * Returns all users (admin only)
     * @throws {GraphQLError} If user is not authenticated or not an admin
     */
    users: async (_: any, __: any, context: Context) => {
      if (!context.isAuthenticated || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized');
      }
      return await User.find();
    },

    // Property queries will be implemented later
    property: async (_: any, { id }: { id: string }) => {
      return null;
    },

    properties: async (_: any, args: any) => {
      return [];
    },

    // Booking queries will be implemented later
    booking: async (_: any, { id }: { id: string }) => {
      return null;
    },

    myBookings: async (_: any, __: any, context: Context) => {
      return [];
    },

    propertyBookings: async (_: any, { propertyId }: { propertyId: string }) => {
      return [];
    },

    // Review queries will be implemented later
    review: async (_: any, { id }: { id: string }) => {
      return null;
    },

    propertyReviews: async (_: any, { propertyId }: { propertyId: string }) => {
      return [];
    },
  },

  Mutation: {
    /**
     * Registers a new user
     * @throws {GraphQLError} If user already exists or registration fails
     */
    register: async (_: any, { input }: { input: RegisterInput }) => {
      try {
        console.log('Starting registration process for email:', input.email);
        const { name, email, password } = input;

        // Check if user already exists
        console.log('Checking for existing user...');
        const existingUser = await User.findOne({ email });
        console.log('Existing user check result:', existingUser ? 'User exists' : 'User does not exist');
        
        if (existingUser) {
          throw new GraphQLError('User already exists with this email');
        }

        // Create new user - always as regular USER role
        console.log('Creating new user...');
        const user = await User.create({
          name,
          email,
          password,
          role: 'USER', // Force USER role for all new registrations
        });
        console.log('User created successfully:', user.id);

        // Generate token
        console.log('Generating token...');
        const token = signToken(user);
        console.log('Token generated successfully');

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('Error in registration:', error);
        throw error;
      }
    },

    /**
     * Authenticates a user and returns a token
     * @throws {GraphQLError} If credentials are invalid
     */
    login: async (_: any, { input }: { input: LoginInput }) => {
      const { email, password } = input;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new GraphQLError('Invalid credentials');
      }

      // Check password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials');
      }

      // Generate token
      const token = signToken(user);

      // Remove password from response
      user.password = undefined;

      return {
        user,
        token,
      };
    },

    /**
     * Updates the current user's profile
     * @throws {GraphQLError} If user is not authenticated
     */
    updateProfile: async (_: any, 
      { name, password }: { name?: string; password?: string }, 
      context: Context
    ) => {
      if (!context.isAuthenticated) {
        throw new GraphQLError('Not authenticated');
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (password) updateData.password = await bcrypt.hash(password, 12);

      const user = await User.findByIdAndUpdate(
        context.user.id,
        updateData,
        { new: true, runValidators: true }
      );

      return user;
    },

    // Property mutations will be implemented later
    createProperty: async (_: any, { input }: any) => {
      return null;
    },

    updateProperty: async (_: any, { id, input }: any) => {
      return null;
    },

    deleteProperty: async (_: any, { id }: any) => {
      return false;
    },

    // Booking mutations will be implemented later
    createBooking: async (_: any, { propertyId, input }: any) => {
      return null;
    },

    updateBookingStatus: async (_: any, { id, status }: any) => {
      return null;
    },

    // Review mutations will be implemented later
    createReview: async (_: any, { propertyId, input }: any) => {
      return null;
    },
  },

  User: {
    /**
     * Returns the properties owned by the user
     */
    properties: async (user: any) => {
      return [];
    },
    /**
     * Returns the bookings made by the user
     */
    bookings: async (user: any) => {
      return [];
    },
    /**
     * Returns the reviews made by the user
     */
    reviews: async (user: any) => {
      return [];
    },
  },
};
