import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const galleryId = formData.get('galleryId') as string;
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0');

    if (!file || !galleryId) {
      return new Response(JSON.stringify({ error: 'Missing file or galleryId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify gallery belongs to user
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .eq('user_id', user.id)
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery error:', galleryError);
      return new Response(JSON.stringify({ error: 'Gallery not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `photoserve/${user.id}/${galleryId}`;
    
    // Generate signature for Cloudinary
    const signatureString = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', dataUri);
    cloudinaryFormData.append('api_key', cloudinaryApiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', folder);

    console.log('Uploading to Cloudinary...');
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to upload to Cloudinary', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log('Cloudinary upload success:', cloudinaryData.public_id);

    // Calculate file size in MB
    const fileSizeMb = file.size / (1024 * 1024);

    // Save image record to database
    const { data: image, error: imageError } = await supabase
      .from('images')
      .insert({
        gallery_id: galleryId,
        cloudinary_url: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
        file_size_mb: fileSizeMb,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (imageError) {
      console.error('Database error:', imageError);
      return new Response(JSON.stringify({ error: 'Failed to save image record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user's storage usage
    await supabase.rpc('increment_storage', { user_id: user.id, size_mb: fileSizeMb });

    console.log('Image saved successfully:', image.id);
    return new Response(JSON.stringify({ 
      success: true, 
      image: {
        id: image.id,
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
