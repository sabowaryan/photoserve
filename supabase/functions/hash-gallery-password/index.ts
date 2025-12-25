import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// CORS (web)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


// Hash password using bcrypt (industry standard)
async function hashPassword(password: string): Promise<string> {
  // bcrypt lib here is sync; we keep an async signature for drop-in compatibility.
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
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

    console.log('[HASH-PASSWORD] hashing with bcrypt');

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

      // Update the password hash
      const { error: updateError } = await supabase
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
    console.log('[HASH-PASSWORD] returning bcrypt hash for new gallery');
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
