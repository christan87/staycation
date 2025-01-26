/**
 * GraphQL Operation Type Definitions
 * 
 * This file contains TypeScript type definitions for GraphQL operations,
 * including:
 * - User type and its fields
 * - Authentication response types
 * - Query and Mutation response types
 * 
 * These types are used to ensure type safety when executing GraphQL
 * operations in tests and the application.
 */

/**
 * Represents a user in the system
 */
export type User = {
  /** Unique identifier for the user */
  id: string;
  /** User's full name */
  name: string;
  /** User's email address (unique) */
  email: string;
  /** User's role in the system */
  role: 'USER' | 'HOST' | 'ADMIN';
};

/**
 * Response type for authentication operations
 */
export type AuthResponse = {
  /** JWT token for authenticated requests */
  token: string;
  /** User data for the authenticated user */
  user: User;
};

/**
 * Response type for the register mutation
 */
export type RegisterMutation = {
  /** Registration response containing token and user data */
  register: AuthResponse;
};

/**
 * Response type for the login mutation
 */
export type LoginMutation = {
  /** Login response containing token and user data */
  login: AuthResponse;
};

/**
 * Response type for the me query
 */
export type MeQuery = {
  /** Current authenticated user data */
  me: User;
};
