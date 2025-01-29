import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
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
          // Registration
          if (!credentials.name) {
            throw new Error('Please enter a name');
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email: credentials.email });
          if (existingUser) {
            throw new Error('User already exists');
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          // Create new user
          const user = await User.create({
            name: credentials.name,
            email: credentials.email,
            password: hashedPassword,
            role: 'USER',
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } else {
          // Login
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error('No user found');
          }

          // Check password
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          console.log('Connecting to database...');
          await dbConnect();
          console.log('Database connected');
          
          // Check if user already exists
          console.log('Checking if user exists:', user.email);
          let dbUser = await User.findOne({ email: user.email });
          console.log('Existing user:', dbUser);
          
          if (!dbUser) {
            console.log('Creating new user...');
            const userData = {
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: true,
              provider: account.provider,
              providerId: account.providerAccountId,
              role: 'USER',
            };
            console.log('User data:', userData);
            
            dbUser = await User.create(userData);
            console.log('New user created:', dbUser);
          } else {
            // Update existing user with OAuth info if they don't have it
            if (!dbUser.provider || !dbUser.providerId) {
              console.log('Updating existing user with OAuth info...');
              dbUser = await User.findByIdAndUpdate(
                dbUser._id,
                {
                  $set: {
                    provider: account.provider,
                    providerId: account.providerAccountId,
                    image: user.image,
                    emailVerified: true,
                  }
                },
                { new: true }
              );
              console.log('User updated:', dbUser);
            }
          }
          
          // Attach the database user id to the user object
          user.id = dbUser._id.toString();
          console.log('User ID attached:', user.id);
          return true;
        } catch (error: any) {
          console.error('Detailed error in signIn callback:', {
            message: error.message || 'Unknown error occurred',
            name: error.name || 'Error',
            stack: error.stack || 'No stack trace available',
            code: error.code,
            ...(error.errors && { validationErrors: error.errors })
          });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          userId: user.id,
          provider: account.provider,
        };
      }

      // Update session
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.accessToken = token.accessToken as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the url is a relative url
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If the url is absolute but for the same site
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
    signOut: '/login', // Redirect to login page after sign out
  },
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user);
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
