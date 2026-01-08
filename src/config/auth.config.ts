/**
 * NextAuth.js Configuration
 * Authentication configuration with Credentials and Google OAuth providers
 *
 * ARCHITECTURE:
 * - NextAuth gère les sessions JWT côté client
 * - Les tokens Supabase sont stockés dans le JWT NextAuth
 * - Cela permet aux RLS policies Supabase de fonctionner avec auth.uid()
 */

import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signInSchema } from "@/lib/validators/auth.schema";
import { createAdminClient } from "@/lib/supabase/server";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/*                               Type Augments                                */
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
    id: string;
    email: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    supabaseAccessTokenExpires?: number;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Helper Logic                                 */
/* -------------------------------------------------------------------------- */

async function updateUserSignIn(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  provider: "email" | "google"
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_user_signin", {
      p_user_id: userId,
      p_provider: provider,
    });

    if (error) {
      console.error("[Auth] RPC update_user_signin failed:", error.message);
      try {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { provider },
        });
        return true;
      } catch (fallbackError) {
        console.error("[Auth] Fallback metadata update failed:", fallbackError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("[Auth] Unexpected error in updateUserSignIn:", error);
    return false;
  }
}

async function waitForProfileCreation(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  maxRetries = 5
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!error && data) return true;

      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    } catch (error) {
      console.error(`[Auth] Profile check attempt ${attempt + 1} failed:`, error);
    }
  }

  console.error("[Auth] Profile not created after retries");
  return false;
}

function validateUserData(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email);
}

function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXTAUTH_COOKIE_DOMAIN || "piksend.com";
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*                               Auth Options                                  */
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
        try {
          const validated = signInSchema.safeParse(credentials);
          if (!validated.success) return null;

          const supabase = createAdminClient();
          const { email, password } = validated.data;

          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
          });

          if (error || !data.user || !data.session) return null;

          await updateUserSignIn(supabase, data.user.id, "email");

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (!profile) return null;

          return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            image: profile.avatar_url,
            supabaseAccessToken: data.session.access_token,
            supabaseRefreshToken: data.session.refresh_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },

    async signIn({ user, account }) {
      if (!validateUserData(user)) return false;

      if (account?.provider !== "google") return true;

      const supabase = createAdminClient();
      const email = user.email!.toLowerCase();

      const { data } = await supabase.auth.admin.listUsers();
      const existing = data?.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existing) {
        user.id = existing.id;
        await updateUserSignIn(supabase, existing.id, "google");
        return true;
      }

      const { data: created } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: user.name ?? "",
          avatar_url: user.image ?? "",
          provider: "google",
        },
      });

      if (!created?.user) return false;

      const ok = await waitForProfileCreation(supabase, created.user.id);
      if (!ok) return false;

      user.id = created.user.id;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.supabaseAccessToken = user.supabaseAccessToken;
        token.supabaseRefreshToken = user.supabaseRefreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.supabaseAccessToken = token.supabaseAccessToken;
      session.supabaseRefreshToken = token.supabaseRefreshToken;
      return session;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth",
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

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
