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

const baseTypeDefs = `
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
    loginUser(input: LoginInput!): LoginResponse!
  }
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
};

// Merge the base typeDefs with our image upload typeDefs
const mergedTypeDefs = [baseTypeDefs, imageUploadTypeDefs];

// Merge the base resolvers with our image upload resolvers
const mergedResolvers = {
  ...baseResolvers,
  ...resolvers,
};

const schema = createSchema({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: async ({ request }): Promise<Context> => {
    const session = await getServerSession(authOptions);
    return { session };
  },
});

export { handleRequest as GET, handleRequest as POST };
