import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';

// Define auth options separately from the route
const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isRegistering: { label: "Is Registering", type: "boolean" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        await dbConnect();

        if (credentials.isRegistering === 'true') {
          if (!credentials.name) {
            throw new Error('Please enter a name');
          }

          const existingUser = await User.findOne({ email: credentials.email });
          if (existingUser) {
            throw new Error('User already exists');
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          const user = await User.create({
            name: credentials.name,
            email: credentials.email,
            password: hashedPassword,
            role: 'GUEST',
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } else {
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error('No user found');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Create the handler
const handler = NextAuth(options);

// Export only the route handlers
export { handler as GET, handler as POST };

// Export options through a function to avoid route export issues
export function getAuthOptions() {
  return options;
}
