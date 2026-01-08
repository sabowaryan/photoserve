/**
 * NextAuth.js Configuration
 * Authentication configuration with Credentials and Google OAuth providers
 * 
 * ARCHITECTURE:
 * - NextAuth gère les sessions JWT côté client
 * - Les tokens Supabase sont stockés dans le JWT NextAuth
 * - Cela permet aux RLS policies Supabase de fonctionner avec auth.uid()
 */
import type { NextAuthOptions, User } from ‘next-auth’;
import CredentialsProvider from ‘next-auth/providers/credentials’;
import GoogleProvider from ‘next-auth/providers/google’;
import { signInSchema } from ‘@/lib/validators/auth.schema’;
import { createAdminClient } from ‘@/lib/supabase/server’;
import jwt from ‘jsonwebtoken’;

// Extend the built-in session types
declare module ‘next-auth’ {
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

declare module ‘next-auth/jwt’ {
interface JWT {
id: string;
email: string;
supabaseAccessToken?: string;
supabaseRefreshToken?: string;
supabaseAccessTokenExpires?: number;
}
}

/**

- Helper: Mettre à jour last_sign_in_at et provider via RPC
  */
  async function updateUserSignIn(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  provider: ‘email’ | ‘google’
  ): Promise<boolean> {
  try {
  const { error } = await supabase.rpc(‘update_user_signin’, {
  p_user_id: userId,
  p_provider: provider,
  });
  
  if (error) {
  console.error(’[Auth] RPC update_user_signin failed:’, error.message);
  // Fallback: Au moins mettre à jour le provider dans les metadata
  try {
  await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
  provider,
  },
  });
  return true;
  } catch (fallbackError) {
  console.error(’[Auth] Fallback metadata update failed:’, fallbackError);
  return false;
  }
  }
  return true;
  } catch (error) {
  console.error(’[Auth] Unexpected error in updateUserSignIn:’, error);
  return false;
  }
  }

/**

- Helper: Attendre la création du profil avec retry
  */
  async function waitForProfileCreation(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  maxRetries: number = 5
  ): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
  const { data: profile, error } = await supabase
  .from(‘profiles’)
  .select(‘id’)
  .eq(‘id’, userId)
  .single();
  
  if (!error && profile) {
  console.log(’[Auth] Profile created successfully’);
  return true;
  }
  
  if (attempt < maxRetries - 1) {
  await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
  }
  } catch (error) {
  console.error(`[Auth] Profile check attempt ${attempt + 1} failed:`, error);
  }
  }

console.error(’[Auth] Profile not created after retries’);
return false;
}

/**

- Helper: Valider les données entrantes
  */
  function validateUserData(user: User | null | undefined): boolean {
  if (!user?.email) {
  console.error(’[Auth] Invalid user data: missing email’);
  return false;
  }
  if (!user.email.match(/^[^\s@]+@[^\s@]+.[^\s@]+$/)) {
  console.error(’[Auth] Invalid user data: invalid email format’);
  return false;
  }
  return true;
  }

/**

- Helper: Décoder et vérifier l’expiration du JWT
  */
  function isTokenExpired(token: string): boolean {
  try {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.payload?.exp) {
  return true;
  }
  const expiresIn = decoded.payload.exp * 1000 - Date.now();
  return expiresIn < 5 * 60 * 1000; // Expire dans moins de 5 minutes
  } catch (error) {
  console.error(’[Auth] Token decode error:’, error);
  return true;
  }
  }

/**

- Helper: Obtenir le domaine du cookie basé sur l’environnement
  */
  function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV === ‘production’) {
  return process.env.NEXTAUTH_COOKIE_DOMAIN || ‘piksend.com’;
  }
  // En développement, ne pas spécifier de domaine
  return undefined;
  }

export const authOptions: NextAuthOptions = {
providers: [
GoogleProvider({
clientId: process.env.GOOGLE_CLIENT_ID || ‘’,
clientSecret: process.env.GOOGLE_CLIENT_SECRET || ‘’,
authorization: {
params: {
prompt: ‘consent’,
access_type: ‘offline’,
response_type: ‘code’,
},
},
}),
CredentialsProvider({
name: ‘credentials’,
credentials: {
email: { label: ‘Email’, type: ‘email’ },
password: { label: ‘Password’, type: ‘password’ },
},
async authorize(credentials): Promise<User | null> {
try {
// Valider les credentials
const validatedFields = signInSchema.safeParse(credentials);
if (!validatedFields.success) {
console.error(’[Auth] Validation failed:’, validatedFields.error.flatten());
return null;
}

```
      const { email, password } = validatedFields.data;
      const supabase = createAdminClient();

      // Authentifier avec Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError || !signInData.user || !signInData.session) {
        console.error('[Auth] Sign in failed:', signInError?.message);
        return null;
      }

      // Mettre à jour last_sign_in_at et provider
      const updateSuccess = await updateUserSignIn(supabase, signInData.user.id, 'email');
      if (!updateSuccess) {
        console.warn('[Auth] Failed to update sign in info, continuing anyway');
      }

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('[Auth] Profile not found:', profileError?.message);
        return null;
      }

      // Retourner l'utilisateur avec les tokens Supabase
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
```

],

callbacks: {
async redirect({ url, baseUrl }) {
try {
// Si l’URL est relative, la préfixer avec baseUrl
if (url.startsWith(’/’)) {
return `${baseUrl}${url}`;
}
// Si l’URL est sur le même domaine, l’autoriser
if (new URL(url).origin === baseUrl) {
return url;
}
} catch (error) {
console.error(’[Auth] Redirect URL parsing error:’, error);
}
// Par défaut, rediriger vers le dashboard
return `${baseUrl}/dashboard`;
},

```
async signIn({ user, account }) {
  // Valider les données de l'utilisateur
  if (!validateUserData(user)) {
    return false;
  }

  if (account?.provider === 'google') {
    try {
      const supabase = createAdminClient();

      if (!user.email) {
        console.error('[Auth] Google user missing email');
        return false;
      }

      const normalizedEmail = user.email.toLowerCase();

      // Chercher l'utilisateur par email (pas par ID, car c'est la première connexion)
      let existingUserId: string | null = null;
      try {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers({
          filters: {
            user_email_contains: normalizedEmail,
          },
        });

        if (!listError && users?.users) {
          const found = users.users.find(u => u.email?.toLowerCase() === normalizedEmail);
          if (found) {
            existingUserId = found.id;
          }
        }
      } catch (listError) {
        console.warn('[Auth] Failed to list users, trying single email lookup:', listError);
      }

      // Si l'utilisateur existe déjà dans auth.users
      if (existingUserId) {
        console.log('[Auth] Google user exists, updating metadata');

        // Mettre à jour les metadata
        try {
          await supabase.auth.admin.updateUserById(existingUserId, {
            user_metadata: {
              name: user.name || '',
              full_name: user.name || '',
              avatar_url: user.image || '',
              provider: 'google',
            },
          });
        } catch (updateError) {
          console.error('[Auth] Failed to update Google user metadata:', updateError);
          // Continuer quand même
        }

        // Mettre à jour last_sign_in_at
        const signInSuccess = await updateUserSignIn(supabase, existingUserId, 'google');
        if (!signInSuccess) {
          console.warn('[Auth] Failed to update sign in timestamp, continuing');
        }

        user.id = existingUserId;
        return true;
      }

      // Si l'utilisateur n'existe pas, le créer
      console.log('[Auth] Creating new Google user');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          name: user.name || '',
          full_name: user.name || '',
          avatar_url: user.image || '',
          provider: 'google',
        },
      });

      if (authError || !authUser?.user) {
        console.error('[Auth] Failed to create Supabase auth user:', authError?.message);
        return false;
      }

      // Mettre à jour last_sign_in_at
      const signInSuccess = await updateUserSignIn(supabase, authUser.user.id, 'google');
      if (!signInSuccess) {
        console.warn('[Auth] Failed to update sign in timestamp for new user, continuing');
      }

      // Attendre la création du profil via trigger
      const profileCreated = await waitForProfileCreation(supabase, authUser.user.id);

      if (!profileCreated) {
        console.error('[Auth] Profile creation timeout');
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (deleteError) {
          console.error('[Auth] Failed to delete user after profile creation failure:', deleteError);
        }
        return false;
      }

      user.id = authUser.user.id;
      return true;
    } catch (error) {
      console.error('[Auth] Google sign in error:', error);
      return false;
    }
  }

  // Pour les autres providers
  return true;
},

async jwt({ token, user, trigger, session }) {
  // Initial sign in
  if (user) {
    token.id = user.id;
    token.email = user.email;
    token.supabaseAccessToken = user.supabaseAccessToken;
    token.supabaseRefreshToken = user.supabaseRefreshToken;

    // Décoder et stocker l'expiration du token Supabase
    if (user.supabaseAccessToken) {
      try {
        const decoded = jwt.decode(user.supabaseAccessToken, { complete: true });
        if (decoded?.payload?.exp) {
          token.supabaseAccessTokenExpires = decoded.payload.exp * 1000;
        }
      } catch (error) {
        console.error('[Auth] Failed to decode Supabase token:', error);
      }
    }
  }

  // Refresh Supabase token si expiré ou en approche de l'expiration
  if (token.supabaseRefreshToken) {
    const now = Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    // Vérifier l'expiration du token stocké
    const shouldRefresh =
      !token.supabaseAccessTokenExpires ||
      now >= token.supabaseAccessTokenExpires - refreshThreshold;

    if (shouldRefresh) {
      try {
        console.log('[Auth] Refreshing Supabase token');
        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: token.supabaseRefreshToken,
        });

        if (!error && data?.session) {
          token.supabaseAccessToken = data.session.access_token;
          token.supabaseRefreshToken = data.session.refresh_token;

          // Mettre à jour l'expiration
          try {
            const decoded = jwt.decode(data.session.access_token, { complete: true });
            if (decoded?.payload?.exp) {
              token.supabaseAccessTokenExpires = decoded.payload.exp * 1000;
            }
          } catch (error) {
            console.error('[Auth] Failed to decode refreshed token:', error);
          }
        } else {
          console.error('[Auth] Token refresh failed:', error?.message);
          // Le token est invalide, l'utilisateur devra se reconnecter
          return null;
        }
      } catch (error) {
        console.error('[Auth] Unexpected error during token refresh:', error);
        return null;
      }
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
```

},

pages: {
signIn: ‘/auth’,
error: ‘/auth’,
},

events: {
async signIn({ user, account, profile, isNewUser }) {
try {
console.log(’[Auth Event] User signed in:’, {
userId: user?.id,
email: user?.email,
provider: account?.provider,
isNewUser,
timestamp: new Date().toISOString(),
});

```
    // TODO: Implémenter un audit logging en base de données
    // await logAuthEvent('sign_in', user?.id, account?.provider, isNewUser);
  } catch (error) {
    console.error('[Auth Event] Error logging sign in:', error);
  }
},

async signOut({ token }) {
  try {
    console.log('[Auth Event] User signed out:', {
      userId: token?.id,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implémenter un audit logging
    // await logAuthEvent('sign_out', token?.id);
  } catch (error) {
    console.error('[Auth Event] Error logging sign out:', error);
  }
},

async error({ error }) {
  console.error('[Auth Event] Authentication error:', {
    error: error?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
  });

  // TODO: Envoyer une alerte ou logger dans un système d'erreur
},
```

},

session: {
strategy: ‘jwt’,
maxAge: 30 * 24 * 60 * 60, // 30 days
updateAge: 24 * 60 * 60, // Refresh token une fois par jour
},

cookies: {
sessionToken: {
name: ‘__Secure-next-auth.session-token’,
options: {
httpOnly: true,
sameSite: process.env.NODE_ENV === ‘production’ ? ‘none’ : ‘lax’,
secure: process.env.NODE_ENV === ‘production’,
path: ‘/’,
domain: getCookieDomain(),
},
},
callbackUrl: {
name: ‘__Secure-next-auth.callback-url’,
options: {
httpOnly: true,
sameSite: process.env.NODE_ENV === ‘production’ ? ‘none’ : ‘lax’,
secure: process.env.NODE_ENV === ‘production’,
path: ‘/’,
domain: getCookieDomain(),
},
},
csrfToken: {
name: ‘__Host-next-auth.csrf-token’,
options: {
httpOnly: true,
sameSite: process.env.NODE_ENV === ‘production’ ? ‘none’ : ‘lax’,
secure: process.env.NODE_ENV === ‘production’,
path: ‘/’,
},
},
},

secret: process.env.NEXTAUTH_SECRET,

// Configuration supplémentaire
debug: process.env.NODE_ENV === ‘development’,
};
