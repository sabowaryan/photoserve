import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

// Plan configuration matching Landing page pricing
const PLAN_LIMITS = {
  premium: {
    storage_limit_mb: 5120, // 5 Go
    max_galleries: 50,
    max_images_per_gallery: 500,
    max_image_size_mb: 50, // Illimité en pratique
  },
  pro: {
    storage_limit_mb: 51200, // 50 Go
    max_galleries: 500,
    max_images_per_gallery: 5000,
    max_image_size_mb: 100, // Illimité en pratique
  },
};

// Map product IDs to plan names (supports both EUR and USD products)
const PRODUCT_TO_PLAN: Record<string, keyof typeof PLAN_LIMITS> = {
  // USD products (current)
  "prod_TeoloHfEgmqI5Z": "premium",
  "prod_TeoltbJQw5IZv5": "pro",
  // EUR products (legacy)
  "prod_TekDZmc5kiGli8": "premium",
  "prod_TekDzBLoGEfWhH": "pro",
};

const FREE_LIMITS = {
  storage_limit_mb: 20,
  max_galleries: 3,
  max_images_per_gallery: 30,
  max_image_size_mb: 1,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, user has free plan");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Update customer ID in profile if not set
    await supabaseClient
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      
      // Reset to free plan
      await supabaseClient
        .from("profiles")
        .update({
          subscription_plan: "free",
          storage_limit_mb: 20,
          max_galleries: 3,
          max_images_per_gallery: 30,
          max_image_size_mb: 1,
          stripe_subscription_id: null,
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const productId = subscription.items.data[0].price.product as string;
    
    logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });

    // Determine plan from product ID
    const planName = PRODUCT_TO_PLAN[productId] || null;
    const planLimits = planName ? PLAN_LIMITS[planName] : FREE_LIMITS;

    logStep("Determined plan", { planName: planName || "free", planLimits });

    // Update profile with subscription info
    await supabaseClient
      .from("profiles")
      .update({
        subscription_plan: planName || "free",
        stripe_subscription_id: subscription.id,
        ...planLimits,
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan: planName || "free",
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
