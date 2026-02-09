/**
 * Authentication Service
 * Handles user authentication, registration, and password management
 * 
 * IMPORTANT: Le trigger Supabase `on_auth_user_created` crée automatiquement
 * le profil dans la table `profiles` quand un utilisateur est créé dans `auth.users`.
 * On ne doit PAS insérer manuellement dans profiles.
 */
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/server';
import { signUpSchema, type SignUpInput } from '@/lib/validators/auth.schema';
import { ValidationError } from '@/lib/errors';
import type { Profile } from '@/types';

const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  success: boolean;
  user?: Profile;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  error?: string;
}

export interface IAuthService {
  signUp(data: SignUpInput): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  resetPasswordRequest(email: string): Promise<{ success: boolean; error?: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }>;
}

export class AuthService implements IAuthService {
  /**
   * Register a new user with email and password
   * Le trigger Supabase crée automatiquement le profil
   */
  async signUp(data: SignUpInput): Promise<AuthResult> {
    // Validate input
    const validatedFields = signUpSchema.safeParse(data);
    if (!validatedFields.success) {
      throw new ValidationError('Invalid input', {
        errors: validatedFields.error.issues,
      });
    }

    const { email, password, name } = validatedFields.data;
    const normalizedEmail = email.toLowerCase();

    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email_verified')
      .eq('email', normalizedEmail)
      .single();

    if (existingProfile) {
      // If user exists but email not verified, provide helpful message
      if (!existingProfile.email_verified) {
        return {
          success: false,
          error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter pour renvoyer l\'email de vérification.',
        };
      }
      
      return {
        success: false,
        error: 'Un compte existe déjà avec cette adresse email',
      };
    }

    // Create Supabase auth user
    // Le trigger `on_auth_user_created` crée automatiquement le profil
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm in Supabase Auth, but we track verification separately in profiles
      user_metadata: {
        name: name || null,
        full_name: name || null, // Le trigger utilise 'full_name' ou 'name'
        provider: 'credentials',
      },
    });

    if (authError) {
      console.error('[AuthService] Failed to create auth user:', authError);
      return {
        success: false,
        error: 'Erreur lors de la création du compte',
      };
    }

    // Attendre un peu pour que le trigger s'exécute
    await new Promise(resolve => setTimeout(resolve, 100));

    // Récupérer le profil créé par le trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError || !profile) {
      console.error('[AuthService] Profile not found after trigger:', profileError);
      // Le trigger a peut-être échoué, on supprime l'utilisateur auth
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return {
        success: false,
        error: 'Erreur lors de la création du profil',
      };
    }

    return {
      success: true,
      user: {
        ...profile,
        subscription_plan: profile.subscription_plan || 'free',
      } as Profile,
    };
  }

  /**
   * Sign in a user and return Supabase session tokens
   * Ces tokens seront stockés dans le JWT NextAuth pour les RLS policies
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase();
    const supabase = createAdminClient();

    // Authenticate with Supabase
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError || !signInData.user || !signInData.session) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect',
      };
    }

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Profil non trouvé',
      };
    }

    return {
      success: true,
      user: {
        ...profile,
        subscription_plan: profile.subscription_plan || 'free',
      } as Profile,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    };
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Request a password reset email
   */
  async resetPasswordRequest(email: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase();
    const supabase = createAdminClient();

    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (!profile) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      console.error('[AuthService] Failed to send reset email:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'envoi de l\'email de réinitialisation',
      };
    }

    return { success: true };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    // Verify the token and update password
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error) {
      console.error('[AuthService] Invalid reset token:', error);
      return {
        success: false,
        error: 'Le lien de réinitialisation est invalide ou a expiré',
      };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[AuthService] Failed to update password:', updateError);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du mot de passe',
      };
    }

    return { success: true };
  }
}

/**
 * Factory function to create an AuthService instance
 */
export function createAuthService(): IAuthService {
  return new AuthService();
}

// Export singleton instance
export const authService = new AuthService();
