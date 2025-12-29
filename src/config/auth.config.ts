/**
 * NextAuth.js Configuration
 * Authentication configuration with Credentials and Google OAuth providers
 * 
 * ARCHITECTURE:
 * - NextAuth gère les sessions JWT côté client
 * - Les tokens Supabase sont stockés dans le JWT NextAuth
 * - Cela permet aux RLS policies Supabase de fonctionner avec auth.uid()
 */
import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { signInSchema } from '@/lib/validators/auth.schema';
import { createAdminClient } from '@/lib/supabase/server';

// Extend the built-in session types
declare module 'next-auth' {
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

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          // Validate input
          const validatedFields = signInSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;
          const supabase = createAdminClient();

          // Authenticate with Supabase and get session tokens
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
          });

          if (signInError || !signInData.user || !signInData.session) {
            console.error('[Auth] Sign in failed:', signInError?.message);
            return null;
          }

          // Get the profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

          if (profileError || !profile) {
            console.error('[Auth] Profile not found:', profileError?.message);
            return null;
          }

          // Return user with Supabase tokens for RLS
          return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            image: profile.avatar_url,
            supabaseAccessToken: signInData.session.access_token,
            supabaseRefreshToken: signInData.session.refresh_token,
          };
        } catch (error) {
          console.error('[Auth] Credentials authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const supabase = createAdminClient();
          
          // Check if user exists in profiles
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email!.toLowerCase())
            .single();

          if (!existingProfile) {
            // Create Supabase auth user - le trigger crée automatiquement le profil
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: user.email!.toLowerCase(),
              email_confirm: true,
              user_metadata: {
                name: user.name,
                full_name: user.name,
                avatar_url: user.image,
                provider: 'google',
              },
            });

            if (authError) {
              console.error('[Auth] Failed to create Supabase auth user:', authError);
              return false;
            }

            // Attendre que le trigger crée le profil
            await new Promise(resolve => setTimeout(resolve, 100));

            // Vérifier que le profil a été créé
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', authUser.user.id)
              .single();

            if (profileError || !newProfile) {
              console.error('[Auth] Profile not created by trigger:', profileError);
              await supabase.auth.admin.deleteUser(authUser.user.id);
              return false;
            }

            // Update user id to match Supabase user id
            user.id = authUser.user.id;

            // Generate a session for the new user
            // Note: Pour Google OAuth, on ne peut pas obtenir de session Supabase directement
            // On utilisera le service role pour les opérations côté serveur
          } else {
            user.id = existingProfile.id;
          }

          // Pour les utilisateurs Google existants, essayer de créer une session Supabase
          // en utilisant un token personnalisé (si configuré)
          // Pour l'instant, on utilise le service role côté serveur
          
        } catch (error) {
          console.error('[Auth] Google sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.supabaseAccessToken = user.supabaseAccessToken;
        token.supabaseRefreshToken = user.supabaseRefreshToken;
      }

      // Refresh Supabase token if needed
      if (trigger === 'update' && token.supabaseRefreshToken) {
        try {
          const supabase = createAdminClient();
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: token.supabaseRefreshToken,
          });

          if (!error && data.session) {
            token.supabaseAccessToken = data.session.access_token;
            token.supabaseRefreshToken = data.session.refresh_token;
          }
        } catch (error) {
          console.error('[Auth] Failed to refresh Supabase token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.supabaseAccessToken = token.supabaseAccessToken;
        session.supabaseRefreshToken = token.supabaseRefreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
