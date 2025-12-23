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
  
  // Add Supabase project URL if available
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

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Plan-based limits (in MB)
const PLAN_LIMITS = {
  free: { maxImageSize: 1, maxStorageTotal: 20 },
  premium: { maxImageSize: 5, maxStorageTotal: 200 },
  pro: { maxImageSize: 10, maxStorageTotal: 500 },
};

// Magic numbers for image validation
function validateImageMagicNumbers(bytes: Uint8Array): boolean {
  // JPEG: starts with FF D8 FF
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  // PNG: starts with 89 50 4E 47 (‰PNG)
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  // GIF: starts with GIF
  const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  // WEBP: bytes 8-11 are WEBP
  const isWEBP = bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  
  return isJPEG || isPNG || isGIF || isWEBP;
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

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create two clients: one with user's JWT (RLS enforced), one with service role
    const token = authHeader.replace('Bearer ', '');
    
    // User client - RLS enforced, for ownership verification
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client - for storage operations that need elevated permissions
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user via service client (more reliable for token validation)
    const { data: { user }, error: userError } = await serviceSupabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} uploading image...`);

    // Use USER client for profile fetch (RLS enforced - user can only see own profile)
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('subscription_plan, storage_used_mb, storage_limit_mb, max_image_size_mb')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const plan = profile.subscription_plan || 'free';
    const maxImageSizeMb = profile.max_image_size_mb || PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].maxImageSize;
    const storageLimitMb = profile.storage_limit_mb || PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].maxStorageTotal;
    const storageUsedMb = profile.storage_used_mb || 0;

    console.log(`User plan: ${plan}, max image size: ${maxImageSizeMb}MB, storage: ${storageUsedMb}/${storageLimitMb}MB`);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const galleryId = formData.get('galleryId') as string;
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0');

    if (!file || !galleryId) {
      return new Response(JSON.stringify({ error: 'Missing file or gallery information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type (MIME)
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > maxImageSizeMb) {
      console.error(`File too large: ${fileSizeMb.toFixed(2)}MB > ${maxImageSizeMb}MB limit`);
      return new Response(JSON.stringify({ 
        error: `File too large. Maximum size is ${maxImageSizeMb}MB.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check storage limit
    if (storageUsedMb + fileSizeMb > storageLimitMb) {
      console.error(`Storage limit exceeded: ${storageUsedMb + fileSizeMb}MB > ${storageLimitMb}MB`);
      return new Response(JSON.stringify({ 
        error: 'Storage limit exceeded. Upgrade your plan for more storage.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify gallery belongs to user using USER client (RLS enforced)
    // User can only access their own galleries via RLS policy
    const { data: gallery, error: galleryError } = await userSupabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery access denied or not found:', galleryError);
      return new Response(JSON.stringify({ error: 'Gallery not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert file to base64 and validate magic numbers
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Validate actual file content (magic numbers)
    if (!validateImageMagicNumbers(bytes.slice(0, 12))) {
      console.error('File content validation failed - not a valid image');
      return new Response(JSON.stringify({ 
        error: 'Invalid image file. The file does not appear to be a valid image.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base64 = btoa(String.fromCharCode(...bytes));
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary with transformations
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
      return new Response(JSON.stringify({ error: 'Failed to upload image. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log('Cloudinary upload success:', cloudinaryData.public_id);

    // Generate optimized URLs using Cloudinary transformations
    const publicId = cloudinaryData.public_id;
    const baseUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload`;
    
    // Original quality URL (for downloads)
    const originalUrl = cloudinaryData.secure_url;
    
    // Optimized URL for gallery display (auto format, quality, responsive)
    const optimizedUrl = `${baseUrl}/f_auto,q_auto/${publicId}`;
    
    // Thumbnail URL for grid display
    const thumbnailUrl = `${baseUrl}/c_fill,w_400,h_400,f_auto,q_auto/${publicId}`;

    // Save image record to database using service client (needs to insert into images table)
    const { data: image, error: imageError } = await serviceSupabase
      .from('images')
      .insert({
        gallery_id: galleryId,
        cloudinary_url: originalUrl,
        cloudinary_public_id: publicId,
        file_size_mb: fileSizeMb,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (imageError) {
      console.error('Database error:', imageError);
      // Try to delete from Cloudinary since DB save failed
      try {
        const deleteTimestamp = Math.floor(Date.now() / 1000);
        const deleteSignatureString = `public_id=${publicId}&timestamp=${deleteTimestamp}${cloudinaryApiSecret}`;
        const deleteData = encoder.encode(deleteSignatureString);
        const deleteHashBuffer = await crypto.subtle.digest('SHA-1', deleteData);
        const deleteHashArray = Array.from(new Uint8Array(deleteHashBuffer));
        const deleteSignature = deleteHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const deleteFormData = new FormData();
        deleteFormData.append('public_id', publicId);
        deleteFormData.append('api_key', cloudinaryApiKey);
        deleteFormData.append('timestamp', deleteTimestamp.toString());
        deleteFormData.append('signature', deleteSignature);

        await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`, {
          method: 'POST',
          body: deleteFormData,
        });
        console.log('Cleaned up Cloudinary image after DB error');
      } catch (cleanupError) {
        console.error('Failed to cleanup Cloudinary image:', cleanupError);
      }
      
      return new Response(JSON.stringify({ error: 'Failed to save image. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user's storage usage using service client (needs elevated permissions)
    await serviceSupabase.rpc('increment_storage', { user_id: user.id, size_mb: fileSizeMb });

    console.log('Image saved successfully:', image.id);
    return new Response(JSON.stringify({ 
      success: true, 
      image: {
        id: image.id,
        url: originalUrl,
        optimizedUrl,
        thumbnailUrl,
        publicId,
        sizeMb: fileSizeMb,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-image function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
