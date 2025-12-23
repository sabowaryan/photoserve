import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS = {
  premium: {
    product_id: "prod_TejtVkGpfeTzg3",
    storage_limit_mb: 100,
    max_galleries: 10,
    max_images_per_gallery: 50,
    max_image_size_mb: 5,
  },
  pro: {
    product_id: "prod_TejtajZYi6STNV",
    storage_limit_mb: 500,
    max_galleries: 100,
    max_images_per_gallery: 100,
    max_image_size_mb: 10,
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
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
    let planName = "free";
    let planLimits = {
      storage_limit_mb: 20,
      max_galleries: 3,
      max_images_per_gallery: 30,
      max_image_size_mb: 1,
    };

    for (const [name, config] of Object.entries(PLANS)) {
      if (config.product_id === productId) {
        planName = name;
        planLimits = {
          storage_limit_mb: config.storage_limit_mb,
          max_galleries: config.max_galleries,
          max_images_per_gallery: config.max_images_per_gallery,
          max_image_size_mb: config.max_image_size_mb,
        };
        break;
      }
    }

    logStep("Determined plan", { planName, planLimits });

    // Update profile with subscription info
    await supabaseClient
      .from("profiles")
      .update({
        subscription_plan: planName,
        stripe_subscription_id: subscription.id,
        ...planLimits,
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan: planName,
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
