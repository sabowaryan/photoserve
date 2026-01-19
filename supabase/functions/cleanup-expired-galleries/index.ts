import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [CLEANUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Cleanup job started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    const encoder = new TextEncoder();

    const now = new Date().toISOString();
    logStep('Looking for expired galleries', { currentTime: now });

    // Test connection first
    const { count: totalCount, error: countError } = await supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logStep('Error counting galleries', { error: countError });
    } else {
      logStep('Total galleries in database', { count: totalCount });
    }

    // Find all expired galleries
    // Using two separate queries to ensure we catch all cases
    const { data: expiredByDate, error: expiredError } = await supabase
      .from('galleries')
      .select('id, user_id, title, expires_at, is_active')
      .lt('expires_at', now);

    const { data: inactiveGalleries, error: inactiveError } = await supabase
      .from('galleries')
      .select('id, user_id, title, expires_at, is_active')
      .eq('is_active', false);

    if (expiredError) {
      logStep('Error fetching expired galleries', { error: expiredError });
      throw expiredError;
    }

    if (inactiveError) {
      logStep('Error fetching inactive galleries', { error: inactiveError });
      throw inactiveError;
    }

    // Combine and deduplicate galleries
    const allExpired = [...(expiredByDate || []), ...(inactiveGalleries || [])];
    const uniqueIds = new Set();
    const expiredGalleries = allExpired.filter(gallery => {
      if (uniqueIds.has(gallery.id)) {
        return false;
      }
      uniqueIds.add(gallery.id);
      return true;
    });

    logStep('Found galleries', { 
      expiredByDate: expiredByDate?.length || 0,
      inactive: inactiveGalleries?.length || 0,
      totalUnique: expiredGalleries.length 
    });

    if (!expiredGalleries || expiredGalleries.length === 0) {
      logStep('No expired galleries found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No expired galleries to clean up',
        deletedGalleries: 0,
        deletedImages: 0,
        freedStorageMb: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep(`Found ${expiredGalleries.length} expired galleries to clean up`);

    let totalDeletedImages = 0;
    let totalFreedStorageMb = 0;
    const userStorageUpdates: Record<string, number> = {};

    // Process each expired gallery
    for (const gallery of expiredGalleries) {
      logStep(`Processing gallery: ${gallery.title}`, { galleryId: gallery.id });

      // Get all images for this gallery
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('id, cloudinary_public_id, file_size_mb')
        .eq('gallery_id', gallery.id);

      if (imagesError) {
        logStep('Error fetching images', { galleryId: gallery.id, error: imagesError });
        continue;
      }

      // Delete images from Cloudinary
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
              logStep('Deleted image from Cloudinary', { publicId: image.cloudinary_public_id });
              totalDeletedImages++;
              
              const sizeMb = image.file_size_mb || 0;
              totalFreedStorageMb += sizeMb;
              
              // Track storage to decrement per user (skip guest galleries)
              if (gallery.user_id && gallery.user_id !== null) {
                if (!userStorageUpdates[gallery.user_id]) {
                  userStorageUpdates[gallery.user_id] = 0;
                }
                userStorageUpdates[gallery.user_id] += sizeMb;
              }
            } else {
              logStep('Failed to delete from Cloudinary', { 
                publicId: image.cloudinary_public_id,
                status: response.status 
              });
            }
          } catch (cloudinaryError) {
            logStep('Cloudinary error', { 
              publicId: image.cloudinary_public_id, 
              error: cloudinaryError 
            });
          }
        }
      }

      // Delete all images from database
      const { error: deleteImagesError } = await supabase
        .from('images')
        .delete()
        .eq('gallery_id', gallery.id);

      if (deleteImagesError) {
        logStep('Error deleting images from DB', { galleryId: gallery.id, error: deleteImagesError });
      }

      // Delete the gallery
      const { error: deleteGalleryError } = await supabase
        .from('galleries')
        .delete()
        .eq('id', gallery.id);

      if (deleteGalleryError) {
        logStep('Error deleting gallery', { galleryId: gallery.id, error: deleteGalleryError });
      } else {
        logStep('Gallery deleted', { galleryId: gallery.id, title: gallery.title });
      }
    }

    // Update storage for all affected users
    for (const [userId, sizeMb] of Object.entries(userStorageUpdates)) {
      if (sizeMb > 0) {
        const { error: storageError } = await supabase.rpc('decrement_storage', {
          user_id: userId,
          size_mb: sizeMb,
        });

        if (storageError) {
          logStep('Error updating user storage', { userId, error: storageError });
        } else {
          logStep('Updated user storage', { userId, freedMb: sizeMb.toFixed(2) });
        }
      }
    }

    const summary = {
      success: true,
      deletedGalleries: expiredGalleries.length,
      deletedImages: totalDeletedImages,
      freedStorageMb: totalFreedStorageMb,
      affectedUsers: Object.keys(userStorageUpdates).length,
    };

    logStep('Cleanup job completed', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR in cleanup job', { message });
    // Return generic error to client, details are logged server-side only
    return new Response(JSON.stringify({ error: 'Cleanup job failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
