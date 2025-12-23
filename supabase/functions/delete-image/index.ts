import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Dynamic CORS with origin validation
// Secure CORS validation using regex patterns (prevents subdomain spoofing)
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  
  // Allowed origin patterns with strict regex matching
  const allowedPatterns: (RegExp | string)[] = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/[a-zA-Z0-9-]+\.lovable\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.lovableproject\.com$/,
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // User client - RLS enforced
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client - for Cloudinary operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await serviceSupabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageId } = await req.json();

    if (!imageId) {
      return new Response(JSON.stringify({ error: 'Missing image information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} deleting image ${imageId}...`);

    // Use USER client to fetch image - RLS ensures user owns the gallery
    // The images RLS policy checks if the gallery belongs to the user
    const { data: image, error: imageError } = await userSupabase
      .from('images')
      .select('id, cloudinary_public_id, cloudinary_url, file_size_mb, gallery_id')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      console.error('Image not found or access denied:', imageError);
      return new Response(JSON.stringify({ error: 'Image not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete from Cloudinary
    let cloudinaryDeleted = false;
    if (image.cloudinary_public_id) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureString = `public_id=${image.cloudinary_public_id}&timestamp=${timestamp}${cloudinaryApiSecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('public_id', image.cloudinary_public_id);
        cloudinaryFormData.append('api_key', cloudinaryApiKey);
        cloudinaryFormData.append('timestamp', timestamp.toString());
        cloudinaryFormData.append('signature', signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`,
          { method: 'POST', body: cloudinaryFormData }
        );

        if (response.ok) {
          const result = await response.json();
          cloudinaryDeleted = result.result === 'ok';
          console.log(`Cloudinary delete result: ${result.result}`);
        } else {
          console.error('Cloudinary delete failed');
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    // Delete from database using service client
    const { error: deleteError } = await serviceSupabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw deleteError;
    }

    // Update user's storage usage using service client
    const fileSizeMb = image.file_size_mb || 0;
    if (fileSizeMb > 0) {
      await serviceSupabase.rpc('decrement_storage', { 
        user_id: user.id, 
        size_mb: fileSizeMb 
      });
      console.log(`Freed ${fileSizeMb.toFixed(2)}MB of storage`);
    }

    console.log(`Image ${imageId} deleted successfully`);
    return new Response(JSON.stringify({ 
      success: true,
      cloudinaryDeleted,
      freedStorageMb: fileSizeMb,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-image function:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
