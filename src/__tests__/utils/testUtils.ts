/**
 * Test Utilities
 * 
 * This file provides utility functions for testing GraphQL operations and authentication.
 * It includes functions for:
 * - Creating test users with default or custom data
 * - Creating test contexts with authentication tokens
 * - Executing GraphQL operations with proper typing and error handling
 */

import { ApolloServer } from '@apollo/server';
import { User } from '../../server/models/user.model';
import { signToken } from '../../utils/auth';
import { Context } from '../../types/context';
import jwt from 'jsonwebtoken';

/**
 * Creates a test user in the database with optional custom data
 * @param userData - Optional user data to override defaults
 * @returns Object containing the created user and their JWT token
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!@#',
    role: 'USER',
  };

  const user = await User.create({ ...defaultUser, ...userData });
  const token = signToken(user);
  return { user, token };
};

/**
 * Creates a test context object for GraphQL operations
 * @param token - Optional JWT token for authenticated requests
 * @returns Context object with authentication state
 */
export const createTestContext = (token?: string) => {
  let user = null;
  let isAuthenticated = false;

  if (token) {
    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      user = { id: decoded.id };
      isAuthenticated = true;
    } catch (error) {
      // Invalid token, leave user as null and isAuthenticated as false
    }
  }

  return {
    req: {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    },
    token,
    user,
    isAuthenticated,
  };
};

/**
 * Executes a GraphQL operation with proper typing and error handling
 * @param server - Apollo Server instance
 * @param options - Operation options including query, variables, and context
 * @returns Promise resolving to the operation result with proper typing
 */
export const executeOperation = async <TData = any>(
  server: ApolloServer<Context>,
  {
    query,
    variables = {},
    context = {},
  }: {
    query: string;
    variables?: Record<string, any>;
    context?: Partial<Context>;
  }
) => {
  // Create default context for the operation
  const defaultContext: Context = {
    req: { headers: {} },
    token: null,
    user: null,
    isAuthenticated: false,
  };

  // Execute the GraphQL operation
  const response = await server.executeOperation(
    {
      query,
      variables,
    },
    {
      contextValue: { ...defaultContext, ...context },
    }
  );

  // Handle the response based on its type
  if (response.body.kind === 'single') {
    return {
      data: response.body.singleResult.data as TData,
      errors: response.body.singleResult.errors,
    };
  } else {
    throw new Error('Incremental delivery is not supported in tests');
  }
};
