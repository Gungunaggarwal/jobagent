import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import connectMongo from "@/lib/mongodb"
import User from "@/models/User"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectMongo();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("Invalid email or password");
        }
        
        // If they registered with OAuth, they might not have a password
        if (!user.password) {
           throw new Error("Please log in using Google or Twitter");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_dev_only",
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth logins, ensure the user exists in our database
      if (account?.provider === "google" || account?.provider === "twitter") {
        await connectMongo();
        
        // Twitter might not provide an email if the app doesn't have elevated permissions
        const fallbackEmail = user.email || `${user.id}@${account.provider}.local`;
        
        let dbUser = await User.findOne({ email: fallbackEmail });
        
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name || 'Unknown User',
            email: fallbackEmail,
            // OAuth users don't need a password hash
          });
        }
        // Attach the db ID to the user object so the jwt callback can see it
        user.id = dbUser._id.toString();
        user.role = dbUser.role;
        user.onboardingComplete = dbUser.onboardingComplete;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign-in
        token.id = user.id;
        token.role = user.role;
        token.onboardingComplete = user.onboardingComplete;
      }
      // If we trigger an update (like after onboarding)
      if (trigger === "update" && session) {
        token.role = session.role;
        token.onboardingComplete = session.onboardingComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.onboardingComplete = token.onboardingComplete;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // By default, NextAuth redirect relies on callbackUrl.
      // But we will handle the "is onboarding complete" check inside the pages/middleware or client-side.
      // Returning callbackUrl directly if it's within the app:
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
