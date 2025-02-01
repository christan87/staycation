import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { signIn } from 'next-auth/react';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { Session } from 'next-auth';
import { typeDefs as imageUploadTypeDefs } from '@/graphql/schemas/schema';
import resolvers from '@/graphql/resolvers';
import { GraphQLError } from 'graphql';

interface LoginInput {
  email: string;
  password: string;
}

interface Context {
  session: (Session & {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'GUEST' | 'HOST' | 'ADMIN';
    };
  }) | null;
}

const baseTypeDefs = `
  enum UserRole {
    GUEST
    HOST
    ADMIN
  }

  type User {
    id: ID!
    name: String!
    email: String!
    image: String
    role: UserRole!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type LoginResponse {
    success: Boolean!
    message: String
    user: User
  }

  type Query {
    getCurrentUser: User
  }

  type Mutation {
    loginUser(input: LoginInput!): LoginResponse!
  }

  scalar Upload
`;

const baseResolvers = {
  Query: {
    getCurrentUser: async (_: unknown, __: unknown, context: Context) => {
      if (!context.session?.user) {
        return null;
      }
      
      await dbConnect();
      const user = await User.findById(context.session.user.id);
      return user;
    },
  },
  Mutation: {
    loginUser: async (_: unknown, { input }: { input: LoginInput }) => {
      try {
        await dbConnect();
        
        const user = await User.findOne({ email: input.email });
        if (!user) {
          return {
            success: false,
            message: 'Invalid credentials',
          };
        }

        const isMatch = await bcrypt.compare(input.password, user.password);
        if (!isMatch) {
          return {
            success: false,
            message: 'Invalid credentials',
          };
        }

        await signIn('credentials', {
          email: input.email,
          password: input.password,
          redirect: false,
        });

        return {
          success: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: 'An error occurred during login',
        };
      }
    },
  },
  Upload: {
    __resolveType: () => null,
  },
};

// Merge the base typeDefs with our image upload typeDefs
const mergedTypeDefs = [baseTypeDefs, imageUploadTypeDefs];

// Merge the base resolvers with our image upload resolvers
const mergedResolvers = {
  ...baseResolvers,
  ...resolvers,
};

const yoga = createYoga({
  schema: createSchema({
    typeDefs: mergedTypeDefs,
    resolvers: {
      ...baseResolvers,
      ...resolvers
    },
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  async context({ request }) {
    // Ensure database connection before processing any request
    try {
      await dbConnect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw new GraphQLError('Database connection failed');
    }
    
    const session = await getServerSession(authOptions);
    return {
      request,
      session,
    };
  }
});

// Export the yoga handler methods directly
const { handleRequest } = yoga;
export { handleRequest as GET, handleRequest as POST };
