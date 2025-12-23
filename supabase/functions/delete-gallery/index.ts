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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { galleryId } = await req.json();

    if (!galleryId) {
      return new Response(JSON.stringify({ error: 'Missing galleryId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} deleting gallery ${galleryId}...`);

    // Verify gallery belongs to user
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .eq('user_id', user.id)
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery not found or unauthorized:', galleryError);
      return new Response(JSON.stringify({ error: 'Gallery not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all images in the gallery
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, cloudinary_public_id, file_size_mb')
      .eq('gallery_id', galleryId);

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch gallery images' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${images?.length || 0} images to delete`);

    // Delete all images from Cloudinary
    let totalSizeDeleted = 0;
    const encoder = new TextEncoder();

    for (const image of images || []) {
      if (image.cloudinary_public_id) {
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          const signatureString = `public_id=${image.cloudinary_public_id}&timestamp=${timestamp}${cloudinaryApiSecret}`;
          const data = encoder.encode(signatureString);
          const hashBuffer = await crypto.subtle.digest('SHA-1', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const formData = new FormData();
          formData.append('public_id', image.cloudinary_public_id);
          formData.append('api_key', cloudinaryApiKey);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`,
            { method: 'POST', body: formData }
          );

          if (response.ok) {
            console.log(`Deleted from Cloudinary: ${image.cloudinary_public_id}`);
            totalSizeDeleted += image.file_size_mb || 0;
          } else {
            console.error(`Failed to delete from Cloudinary: ${image.cloudinary_public_id}`);
          }
        } catch (cloudinaryError) {
          console.error(`Cloudinary delete error for ${image.cloudinary_public_id}:`, cloudinaryError);
        }
      }
    }

    // Delete all images from database
    const { error: deleteImagesError } = await supabase
      .from('images')
      .delete()
      .eq('gallery_id', galleryId);

    if (deleteImagesError) {
      console.error('Error deleting images from DB:', deleteImagesError);
    }

    // Delete the gallery
    const { error: deleteGalleryError } = await supabase
      .from('galleries')
      .delete()
      .eq('id', galleryId);

    if (deleteGalleryError) {
      console.error('Error deleting gallery:', deleteGalleryError);
      return new Response(JSON.stringify({ error: 'Failed to delete gallery' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user's storage usage
    if (totalSizeDeleted > 0) {
      await supabase.rpc('decrement_storage', { 
        user_id: user.id, 
        size_mb: totalSizeDeleted 
      });
      console.log(`Freed ${totalSizeDeleted.toFixed(2)}MB of storage`);
    }

    console.log(`Gallery ${galleryId} deleted successfully`);
    return new Response(JSON.stringify({ 
      success: true,
      deletedImages: images?.length || 0,
      freedStorageMb: totalSizeDeleted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-gallery function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
