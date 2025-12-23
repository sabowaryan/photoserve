import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Dynamic CORS with origin validation - more permissive for public password verification
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  
  const isAllowed = 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('.lovable.app') ||
    origin.includes('.lovableproject.com') ||
    origin.includes(`${projectRef}.supabase.co`);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Simple hash function for password verification (using SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { slug, password } = await req.json();

    if (!slug || !password) {
      return new Response(JSON.stringify({ error: 'Missing slug or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Verifying password for gallery: ${slug}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch gallery with password_hash (only accessible via service role)
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, expires_at, views_count, is_active, password_hash')
      .eq('unique_slug', slug)
      .maybeSingle();

    if (galleryError) {
      console.error('Database error:', galleryError);
      return new Response(JSON.stringify({ error: 'Gallery not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!gallery) {
      return new Response(JSON.stringify({ error: 'Gallery not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired or inactive
    const isExpired = new Date(gallery.expires_at) < new Date();
    if (isExpired || !gallery.is_active) {
      return new Response(JSON.stringify({ error: 'Gallery expired or inactive' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash the provided password and compare
    const hashedPassword = await hashPassword(password);
    
    // Only compare hashed passwords (no plaintext fallback for security)
    const isValidPassword = gallery.password_hash === hashedPassword;

    if (!isValidPassword) {
      // Log without exposing gallery identifier
      console.log('Invalid password attempt detected');
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment view count
    await supabase
      .from('galleries')
      .update({ views_count: gallery.views_count + 1 })
      .eq('id', gallery.id);

    // Fetch images
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, cloudinary_url, order_index')
      .eq('gallery_id', gallery.id)
      .order('order_index');

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return new Response(JSON.stringify({ error: 'Failed to load images' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Password verified for gallery ${slug}, returning ${images?.length || 0} images`);

    return new Response(JSON.stringify({
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        expires_at: gallery.expires_at,
        views_count: gallery.views_count + 1,
      },
      images: images || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-gallery-password:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
