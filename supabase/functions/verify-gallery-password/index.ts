import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Rate limiting storage (in-memory, resets on function cold start)
// For production, consider using Supabase or Redis for persistence
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Check and update rate limit
function checkRateLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(key);
  }
  
  const currentRecord = rateLimitStore.get(key);
  
  if (!currentRecord) {
    // First attempt
    rateLimitStore.set(key, { attempts: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }
  
  if (currentRecord.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((currentRecord.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }
  
  // Increment attempts
  currentRecord.attempts += 1;
  rateLimitStore.set(key, currentRecord);
  
  return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - currentRecord.attempts };
}

// Legacy SHA-256 hash function for backward compatibility with existing passwords
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if a hash is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
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

    // Get client IP and create rate limit key
    const clientIP = getClientIP(req);
    const rateLimitKey = `${clientIP}:${slug}`;
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(rateLimitKey);
    
    if (!rateLimitResult.allowed) {
      console.log(`[VERIFY-PASSWORD] Rate limit exceeded for IP ${clientIP} on gallery ${slug}`);
      return new Response(JSON.stringify({ 
        error: 'Too many password attempts. Please try again later.',
        retryAfterSeconds: rateLimitResult.retryAfterSeconds
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds)
        },
      });
    }

    console.log(`[VERIFY-PASSWORD] Verifying password for gallery: ${slug} (${rateLimitResult.remainingAttempts} attempts remaining)`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch gallery with password_hash (only accessible via service role)
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, expires_at, views_count, is_active, password_hash')
      .eq('unique_slug', slug)
      .maybeSingle();

    if (galleryError) {
      console.error('[VERIFY-PASSWORD] Database error:', galleryError);
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

    // Verify password - support both bcrypt (new) and SHA-256 (legacy) hashes
    let isValidPassword = false;
    
    if (isBcryptHash(gallery.password_hash)) {
      // New bcrypt hash
      isValidPassword = await bcrypt.compare(password, gallery.password_hash);
    } else {
      // Legacy SHA-256 hash - verify and optionally upgrade
      const legacyHash = await hashPasswordLegacy(password);
      isValidPassword = gallery.password_hash === legacyHash;
      
      // If password is valid, upgrade to bcrypt hash
      if (isValidPassword) {
        console.log(`[VERIFY-PASSWORD] Upgrading legacy SHA-256 hash to bcrypt for gallery ${slug}`);
        const salt = await bcrypt.genSalt(12);
        const newBcryptHash = await bcrypt.hash(password, salt);
        
        await supabase
          .from('galleries')
          .update({ password_hash: newBcryptHash })
          .eq('id', gallery.id);
      }
    }

    if (!isValidPassword) {
      console.log(`[VERIFY-PASSWORD] Invalid password attempt for gallery ${slug} from IP ${clientIP}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid password',
        remainingAttempts: rateLimitResult.remainingAttempts - 1
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reset rate limit on successful authentication
    rateLimitStore.delete(rateLimitKey);

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
      console.error('[VERIFY-PASSWORD] Error fetching images:', imagesError);
      return new Response(JSON.stringify({ error: 'Failed to load images' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[VERIFY-PASSWORD] Password verified for gallery ${slug}, returning ${images?.length || 0} images`);

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
    console.error('[VERIFY-PASSWORD] Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
