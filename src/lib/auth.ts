import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/lib/models/user';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await connectDB();
          
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            // Check if this should be the initial admin
            const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
            const isAdmin = initialAdminEmail && user.email.toLowerCase() === initialAdminEmail;
            
            dbUser = await User.create({
              email: user.email,
              name: user.name || 'User',
              image: user.image,
              role: isAdmin ? 'admin' : 'donor',
            });
          } else {
            // Update user info on each login
            dbUser.name = user.name || dbUser.name;
            dbUser.image = user.image || dbUser.image;
            await dbUser.save();
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Error in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
