/**
 * NextAuth.js Configuration
 * Authentication configuration with Credentials and Google OAuth providers
 *
 * ARCHITECTURE:
 * - NextAuth gère les sessions JWT côté client
 * - Les tokens Supabase sont stockés dans le JWT NextAuth
 * - Cela permet aux RLS policies Supabase de fonctionner avec auth.uid()
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signInSchema } from "@/lib/validators/auth.schema";
import { createAdminClient } from "@/lib/supabase/server";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    supabaseAccessTokenExpires?: number;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getTokenExpiry(token?: string): number | null {
  if (!token) return null;
  const decoded = jwt.decode(token) as any;
  return decoded?.exp ? decoded.exp * 1000 : null;
}

function shouldRefresh(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 5 * 60 * 1000;
}

async function refreshSupabaseToken(refreshToken: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session) {
    console.error("[Auth] Supabase refresh failed:", error?.message);
    return null;
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: getTokenExpiry(data.session.access_token),
  };
}

function getCookieDomain(): string | undefined {
  return process.env.NODE_ENV === "production"
    ? process.env.NEXTAUTH_COOKIE_DOMAIN || "piksend.com"
    : undefined;
}

/* -------------------------------------------------------------------------- */
/*                                Auth Config                                 */
/* -------------------------------------------------------------------------- */

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = createAdminClient();
        const { email, password } = parsed.data;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

        if (error || !data.user || !data.session) return null;

        return {
          id: data.user.id,
          email: data.user.email!,
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.supabaseAccessToken = user.supabaseAccessToken;
        token.supabaseRefreshToken = user.supabaseRefreshToken;
        token.supabaseAccessTokenExpires = getTokenExpiry(
          user.supabaseAccessToken
        );
      }

      // Refresh Supabase token
      if (
        token.supabaseRefreshToken &&
        shouldRefresh(token.supabaseAccessTokenExpires)
      ) {
        const refreshed = await refreshSupabaseToken(
          token.supabaseRefreshToken
        );

        if (!refreshed) {
          console.warn("[Auth] Refresh failed, keeping existing token");
          return token;
        }

        token.supabaseAccessToken = refreshed.accessToken;
        token.supabaseRefreshToken = refreshed.refreshToken;
        token.supabaseAccessTokenExpires = refreshed.expiresAt ?? undefined;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.id && token.email) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.supabaseAccessToken = token.supabaseAccessToken;
        session.supabaseRefreshToken = token.supabaseRefreshToken;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: getCookieDomain(),
      },
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
