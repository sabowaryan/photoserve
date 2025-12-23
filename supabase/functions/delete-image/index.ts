import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
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

    // Get image with gallery info to verify ownership
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select(`
        id,
        cloudinary_public_id,
        cloudinary_url,
        file_size_mb,
        gallery:galleries!inner(user_id)
      `)
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      console.error('Image not found:', imageError);
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((image.gallery as any).user_id !== user.id) {
      console.error('Unauthorized: user does not own gallery');
      return new Response(JSON.stringify({ error: 'Access denied' }), {
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
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw deleteError;
    }

    // Update user's storage usage
    const fileSizeMb = image.file_size_mb || 0;
    if (fileSizeMb > 0) {
      await supabase.rpc('decrement_storage', { 
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
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
