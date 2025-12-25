import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Secure CORS validation using regex patterns (prevents subdomain spoofing)
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  
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

// Check rate limit using database (persistent across instances)
async function checkRateLimit(
  supabase: any, 
  key: string
): Promise<{ allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number }> {
  const now = new Date();
  
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limit_attempts')
    .select('id, attempts, expires_at')
    .eq('key', key)
    .maybeSingle();
  
  if (fetchError) {
    console.error('[RATE-LIMIT] Error fetching rate limit:', fetchError);
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS };
  }
  
  if (existing) {
    const expiresAt = new Date(existing.expires_at);
    
    if (expiresAt <= now) {
      await supabase
        .from('rate_limit_attempts')
        .delete()
        .eq('id', existing.id);
      
      const newExpiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
      await supabase
        .from('rate_limit_attempts')
        .insert({
          key,
          attempts: 1,
          first_attempt_at: now.toISOString(),
          expires_at: newExpiresAt.toISOString()
        });
      
      return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1 };
    }
    
    if (existing.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }
    
    const newAttempts = existing.attempts + 1;
    await supabase
      .from('rate_limit_attempts')
      .update({ attempts: newAttempts })
      .eq('id', existing.id);
    
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - newAttempts };
  }
  
  const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
  const { error: insertError } = await supabase
    .from('rate_limit_attempts')
    .insert({
      key,
      attempts: 1,
      first_attempt_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });
  
  if (insertError) {
    const { data: raceRecord } = await supabase
      .from('rate_limit_attempts')
      .select('id, attempts, expires_at')
      .eq('key', key)
      .maybeSingle();
    
    if (raceRecord) {
      const newAttempts = raceRecord.attempts + 1;
      await supabase
        .from('rate_limit_attempts')
        .update({ attempts: newAttempts })
        .eq('id', raceRecord.id);
      
      return { allowed: newAttempts <= RATE_LIMIT_MAX_ATTEMPTS, remainingAttempts: Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - newAttempts) };
    }
  }
  
  return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1 };
}

// Reset rate limit on successful authentication
async function resetRateLimit(supabase: any, key: string): Promise<void> {
  await supabase
    .from('rate_limit_attempts')
    .delete()
    .eq('key', key);
}

// Legacy SHA-256 hash function for backward compatibility with existing passwords
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if a hash is a PBKDF2 hash (starts with $pbkdf2$)
function isPbkdf2Hash(hash: string): boolean {
  return hash.startsWith('$pbkdf2$');
}

// Verify PBKDF2 password
async function verifyPbkdf2Password(password: string, storedHash: string): Promise<boolean> {
  try {
    // Parse stored hash: $pbkdf2$iterations$salt$hash
    // Expected split result (leading $): ["", "pbkdf2", "100000", "<salt>", "<hash>"]
    // We also tolerate a legacy-bug format that had double "$" separators:
    // ["", "pbkdf2", "100000", "", "<salt>", "", "<hash>"]
    const parts = storedHash.split('$');

    let iterationsStr: string | undefined;
    let saltBase64: string | undefined;
    let hashBase64: string | undefined;

    if (parts.length === 5 && parts[1] === 'pbkdf2') {
      iterationsStr = parts[2];
      saltBase64 = parts[3];
      hashBase64 = parts[4];
    } else if (parts.length === 7 && parts[1] === 'pbkdf2' && parts[3] === '' && parts[5] === '') {
      iterationsStr = parts[2];
      saltBase64 = parts[4];
      hashBase64 = parts[6];
    } else {
      return false;
    }

    const iterations = parseInt(iterationsStr, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    
    // Decode salt from base64
    const salt = new Uint8Array(atob(saltBase64).split('').map(c => c.charCodeAt(0)));
    
    // Hash the provided password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    
    // Convert to base64 and compare
    const computedHashArray = new Uint8Array(derivedBits);
    const computedHashBase64 = btoa(String.fromCharCode(...computedHashArray));
    
    return computedHashBase64 === hashBase64;
  } catch (error) {
    console.error('[VERIFY-PASSWORD] PBKDF2 verification error:', error);
    return false;
  }
}

// Hash password using PBKDF2 (for upgrading legacy passwords)
async function hashPasswordPbkdf2(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return '$pbkdf2$100000$' + saltBase64 + '$' + hashBase64;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Check rate limit using database
    const rateLimitResult = await checkRateLimit(supabase, rateLimitKey);
    
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

    // Verify password - support PBKDF2 (new) and SHA-256 (legacy) hashes
    let isValidPassword = false;
    
    if (isPbkdf2Hash(gallery.password_hash)) {
      // PBKDF2 hash - use verification function
      isValidPassword = await verifyPbkdf2Password(password, gallery.password_hash);
    } else {
      // Legacy SHA-256 hash - verify and upgrade
      const legacyHash = await hashPasswordLegacy(password);
      isValidPassword = gallery.password_hash === legacyHash;
      
      // If password is valid, upgrade to PBKDF2 hash
      if (isValidPassword) {
        console.log(`[VERIFY-PASSWORD] Upgrading legacy SHA-256 hash to PBKDF2 for gallery ${slug}`);
        const newPbkdf2Hash = await hashPasswordPbkdf2(password);
        
        await supabase
          .from('galleries')
          .update({ password_hash: newPbkdf2Hash })
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
    await resetRateLimit(supabase, rateLimitKey);

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
