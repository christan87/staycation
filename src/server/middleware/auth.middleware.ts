import { GraphQLError } from 'graphql';
import { getToken } from 'next-auth/jwt';
import { User } from '../models/user.model';

interface AuthContext {
  req: any;
  user?: any;
  isAuthenticated: boolean;
}

export async function authMiddleware(resolve: any, root: any, args: any, context: AuthContext, info: any) {
  try {
    // Get the token from the request
    const token = await getToken({ req: context.req });

    if (!token?.email) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Get user from database
    const user = await User.findOne({ email: token.email });
    
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Add user and authentication status to context
    context.user = user;
    context.isAuthenticated = true;

    // Continue to the resolver
    return await resolve(root, args, context, info);
  } catch (error) {
    throw new GraphQLError(error instanceof Error ? error.message : 'Authentication error', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function requireRole(roles: string[]) {
  return async (resolve: any, root: any, args: any, context: AuthContext, info: any) => {
    // First run the auth middleware
    await authMiddleware(resolve, root, args, context, info);

    // Check if user has required role
    if (!roles.includes(context.user.role)) {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Continue to the resolver
    return await resolve(root, args, context, info);
  };
}

// Helper to check if operation requires authentication
export function requiresAuth(operationName: string, info: any): boolean {
  // List of operations that don't require authentication
  const publicOperations = [
    'login',
    'register',
    'searchProperties',
    'getProperty',
    'getPublicProfile'
  ];

  return !publicOperations.includes(operationName);
}
