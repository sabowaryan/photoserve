import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// CORS (web)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash password using PBKDF2 (native Web Crypto API - works in Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  // Convert to base64
  const hashArray = new Uint8Array(derivedBits);
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  // Return in format: $pbkdf2$iterations$salt$hash
  return `$pbkdf2$${iterations}$${saltBase64}$${hashBase64}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const origin = req.headers.get('origin') || '';

    // Get authorization header (function is protected, so this should be present)
    const authHeader = req.headers.get('Authorization');
    console.log('[HASH-PASSWORD] request received', {
      origin,
      method: req.method,
      hasAuth: !!authHeader,
    });

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the caller JWT (no service role) so RLS applies and auth is consistent
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[HASH-PASSWORD] User verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[HASH-PASSWORD] user verified', { userId: user.id });

    const { password, galleryId, action } = await req.json();

    console.log('[HASH-PASSWORD] payload', {
      action: action || 'create',
      hasGalleryId: !!galleryId,
      passwordLength: typeof password === 'string' ? password.length : null,
    });

    if (!password) {
      return new Response(JSON.stringify({ error: 'Missing password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password length
    if (password.length < 4 || password.length > 100) {
      return new Response(JSON.stringify({ error: 'Password must be between 4 and 100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[HASH-PASSWORD] hashing with PBKDF2');

    const hashedPassword = await hashPassword(password);

    // If galleryId is provided, update the gallery's password
    if (galleryId && action === 'update') {
      // Verify gallery belongs to user
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .select('id, user_id')
        .eq('id', galleryId)
        .eq('user_id', user.id)
        .single();

      if (galleryError || !gallery) {
        console.error('[HASH-PASSWORD] Gallery not found:', galleryError?.message);
        return new Response(JSON.stringify({ error: 'Gallery not found or unauthorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update the password hash using service role for RLS bypass
      const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
      
      const { error: updateError } = await supabaseAdmin
        .from('galleries')
        .update({ password_hash: hashedPassword })
        .eq('id', galleryId);

      if (updateError) {
        console.error('[HASH-PASSWORD] Error updating password:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update password' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[HASH-PASSWORD] Password updated for gallery ${galleryId}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise just return the hashed password for use in gallery creation
    console.log('[HASH-PASSWORD] returning PBKDF2 hash for new gallery');
    return new Response(JSON.stringify({ 
      success: true,
      hashedPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[HASH-PASSWORD] Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
