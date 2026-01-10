/**
 * NextAuth.js Configuration
 * NextAuth + Supabase (auth.users + profiles via triggers)
 *
 * - JWT NextAuth côté client
 * - Tokens Supabase stockés dans le JWT
 * - RPC pour last_sign_in_at + provider
 * - Triggers Supabase → profiles
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
      isAdmin?: boolean;
    };
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    adminSessionLogged?: boolean;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    isAdmin?: boolean;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    supabaseAccessTokenExpires?: number;
    adminSessionLogged?: boolean;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * RPC: update last_sign_in_at + provider
 */
async function updateUserSignIn(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  provider: "email" | "google"
): Promise<boolean> {
  try {
    async function callRpc<T>(supabase: ReturnType<typeof createAdminClient>, fn: string, params: any): Promise<T> {
       return (supabase as any).rpc(fn, params) as Promise<T>;
    }

 // utilisation :
const { error } = await callRpc<{ error?: { message: string } }>(supabase, "update_user_signin", {
  p_user_id: userId,
  p_provider: provider,
});

    if (!error) return true;

    console.error("[Auth] RPC update_user_signin failed:", error.message);

    // Fallback: au moins stocker le provider
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { provider },
    });

    return true;
  } catch (err) {
    console.error("[Auth] updateUserSignIn unexpected error:", err);
    return false;
  }
}

/**
 * Attendre la création du profil via trigger Supabase
 */
async function waitForProfileCreation(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  retries = 5
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (data) return true;

    await new Promise((r) => setTimeout(r, 100 * (i + 1)));
  }

  return false;
}

/**
 * Decode exp from Supabase JWT
 */
function getTokenExpiry(token?: string): number | undefined {
  if (!token) return undefined; // <-- null → undefined

  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;

    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return decoded?.exp ? decoded.exp * 1000 : undefined; // <-- null → undefined
  } catch (error) {
    console.error("[Auth] Failed to decode Supabase JWT:", error);
    return undefined; // <-- null → undefined
  }
}

/**
 * Refresh threshold
 */
function shouldRefresh(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 5 * 60 * 1000;
}

/**
 * Cookie domain
 */
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
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials): Promise<User | null> {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = createAdminClient();
        const { email, password } = parsed.data;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

        if (error || !data.user || !data.session) return null;

        await updateUserSignIn(supabase, data.user.id, "email");

        const { data: profile } = await supabase
          .from("profiles")
          .select("*, is_admin")
          .eq("id", data.user.id)
          .single();

        if (!profile) return null;

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          image: profile.avatar_url,
          isAdmin: profile.is_admin === true,
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token,
        };
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Si l'URL commence par /, c'est une URL relative
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Si l'URL est du même domaine, on la garde
      if (new URL(url).origin === baseUrl) return url;
      // Par défaut, rediriger vers la page callback qui gère la redirection admin
      return `${baseUrl}/auth/callback`;
    },

    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const supabase = createAdminClient();
      const email = user.email?.toLowerCase();
      if (!email) return false;

      // Search existing user
     // Search existing user
const { data } = await (supabase.auth.admin as any).listUsers({
  filters: { user_email_contains: email },
});

const existing = data?.users?.find(
  (u: any) => u.email?.toLowerCase() === email
);

      let userId: string;

      if (existing) {
        userId = existing.id;

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            name: user.name,
            avatar_url: user.image,
            provider: "google",
          },
        });
      } else {
        const { data: created } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            avatar_url: user.image,
            provider: "google",
          },
        });

        if (!created?.user) return false;
        userId = created.user.id;

        const profileOk = await waitForProfileCreation(supabase, userId);
        if (!profileOk) {
          await supabase.auth.admin.deleteUser(userId);
          return false;
        }
      }

      await updateUserSignIn(supabase, userId, "google");
      user.id = userId;

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();
      
      user.isAdmin = profile?.is_admin === true;

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isAdmin = user.isAdmin;
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

    async session({ session, token }) {
      if (token?.id && token.email) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin;
        session.supabaseAccessToken = token.supabaseAccessToken;
        session.supabaseRefreshToken = token.supabaseRefreshToken;
        session.adminSessionLogged = token.adminSessionLogged;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: getCookieDomain(),
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: getCookieDomain(),
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
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
    newUser: "/dashboard",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
