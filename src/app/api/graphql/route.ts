import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { signIn } from 'next-auth/react';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { Session } from 'next-auth';

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
      role?: string;
    };
  }) | null;
}

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    image: String
    role: String
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
    loginUser(input: LoginInput!): LoginResponse
  }
`;

const resolvers = {
  Query: {
    getCurrentUser: async (_: unknown, __: unknown, context: Context) => {
      if (!context.session?.user) {
        throw new Error('Not authenticated');
      }

      const sessionUser = context.session.user;
      return {
        id: sessionUser.id,
        name: sessionUser.name || '',
        email: sessionUser.email || '',
        image: sessionUser.image,
        role: sessionUser.role || 'USER',
      };
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
            message: 'Invalid email or password',
          };
        }

        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          return {
            success: false,
            message: 'Invalid email or password',
          };
        }

        return {
          success: true,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          },
        };
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          message: 'An error occurred during login',
        };
      }
    },
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

const handleRequest = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  async context({ request }): Promise<Context> {
    const session = await getServerSession(authOptions);
    return { session };
  },
});

export { handleRequest as GET, handleRequest as POST };
