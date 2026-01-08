/**
 * NextAuth.js Configuration
 * NextAuth + Supabase (auth.users + triggers → profiles)
 *
 * Google OAuth handled by NextAuth
 * Supabase kept in sync via RPC (update_user_signin)
 */

import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signInSchema } from "@/lib/validators/auth.schema";
import { createAdminClient } from "@/lib/supabase/server";

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

function decodeJwtPayload(token?: string): { exp?: number } | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getTokenExpiry(token?: string): number | null {
  const decoded = decodeJwtPayload(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
}

function shouldRefresh(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 5 * 60 * 1000;
}

function validateUser(user?: User | null): boolean {
  if (!user?.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email);
}

async function updateUserSignIn(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  provider: "email" | "google"
) {
  try {
    await supabase.rpc("update_user_signin", {
      p_user_id: userId,
      p_provider: provider,
    });
  } catch (error) {
    console.error("[Auth] update_user_signin RPC failed:", error);
  }
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
    /* -------------------------------- GOOGLE -------------------------------- */
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

    /* ------------------------------ CREDENTIALS ----------------------------- */
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

        // Sync Supabase metadata
        await updateUserSignIn(supabase, data.user.id, "email");

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
    /* -------------------------------- SIGN IN -------------------------------- */
    async signIn({ user, account }) {
      if (!validateUser(user)) return false;

      const supabase = createAdminClient();

      if (account?.provider === "google") {
        const email = user.email!.toLowerCase();

        const { data } = await supabase.auth.admin.listUsers({
          filters: { user_email_contains: email },
        });

        const existingUser = data?.users?.find(
          u => u.email?.toLowerCase() === email
        );

        if (existingUser) {
          user.id = existingUser.id;
        } else {
          const { data: created, error } =
            await supabase.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                name: user.name ?? "",
                avatar_url: user.image ?? "",
                provider: "google",
              },
            });

          if (error || !created?.user) return false;
          user.id = created.user.id;
        }

        // 🔥 Critical sync
        await updateUserSignIn(supabase, user.id, "google");
      }

      return true;
    },

    /* ---------------------------------- JWT ---------------------------------- */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.supabaseAccessToken = user.supabaseAccessToken;
        token.supabaseRefreshToken = user.supabaseRefreshToken;
        token.supabaseAccessTokenExpires = getTokenExpiry(
          user.supabaseAccessToken
        );
      }

      if (
        token.supabaseRefreshToken &&
        shouldRefresh(token.supabaseAccessTokenExpires)
      ) {
        const supabase = createAdminClient();
        const { data } = await supabase.auth.refreshSession({
          refresh_token: token.supabaseRefreshToken,
        });

        if (data?.session) {
          token.supabaseAccessToken = data.session.access_token;
          token.supabaseRefreshToken = data.session.refresh_token;
          token.supabaseAccessTokenExpires = getTokenExpiry(
            data.session.access_token
          );
        }
      }

      return token;
    },

    /* -------------------------------- SESSION -------------------------------- */
    async session({ session, token }) {
      session.user.id = token.id!;
      session.user.email = token.email!;
      session.supabaseAccessToken = token.supabaseAccessToken;
      session.supabaseRefreshToken = token.supabaseRefreshToken;
      return session;
    },

    /* -------------------------------- REDIRECT -------------------------------- */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  /* --------------------------------- EVENTS -------------------------------- */
  events: {
    async signIn({ user, account }) {
      console.log("[Auth] Sign in", {
        userId: user?.id,
        provider: account?.provider,
      });
    },
    async signOut({ token }) {
      console.log("[Auth] Sign out", { userId: token?.id });
    },
    async error({ error }) {
      console.error("[Auth] Error", error);
    },
  },

  /* -------------------------------- SESSION -------------------------------- */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  /* -------------------------------- COOKIES -------------------------------- */
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: getCookieDomain(),
      },
    },

    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: getCookieDomain(),
      },
    },

    csrfToken: {
      name: "__Host-next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
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
