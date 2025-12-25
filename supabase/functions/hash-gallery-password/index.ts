import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Dynamic CORS with origin validation
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  
  const allowedPatterns: (RegExp | string)[] = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/[a-zA-Z0-9-]+\.lovable\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.lovableproject\.com$/,
    // Custom domain(s)
    /^https:\/\/([a-zA-Z0-9-]+\.)?photoserve\.app$/,
  ];
  
  if (projectRef) {
    allowedPatterns.push(`https://${projectRef}.supabase.co`);
  }
  
  const isAllowed = allowedPatterns.some(pattern => 
    typeof pattern === 'string' ? origin === pattern : pattern.test(origin)
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Hash password using bcrypt (industry standard)
async function hashPassword(password: string): Promise<string> {
  // bcrypt lib here is sync; we keep an async signature for drop-in compatibility.
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[HASH-PASSWORD] No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[HASH-PASSWORD] User verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { password, galleryId, action } = await req.json();

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

    console.log('[HASH-PASSWORD] Hashing password with PBKDF2');
    
    // Hash the password using PBKDF2
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
    console.log('[HASH-PASSWORD] Returning PBKDF2 hash for new gallery');
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
