/**
 * GraphQL Context Type Definitions
 * 
 * This file defines the shape of the context object that is passed to all
 * resolvers in the GraphQL server. The context includes:
 * - User authentication state
 * - Request object for accessing headers
 * - JWT token information
 * - Current user data
 */

export type Context = {
  /**
   * Express request object containing headers and other request data
   */
  req: any;

  /**
   * JWT token from the Authorization header, if present
   */
  token: string | null;

  /**
   * Currently authenticated user data, null if not authenticated
   */
  user: any;

  /**
   * Flag indicating whether the current request is authenticated
   */
  isAuthenticated: boolean;
};
