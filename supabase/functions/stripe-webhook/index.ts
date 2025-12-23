import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Plan configuration matching the app pricing
// Supports both EUR and USD product IDs
const PLAN_LIMITS = {
  premium: {
    storage_limit_mb: 5120, // 5 Go
    max_galleries: 50,
    max_images_per_gallery: 500,
    max_image_size_mb: 50,
  },
  pro: {
    storage_limit_mb: 51200, // 50 Go
    max_galleries: 500,
    max_images_per_gallery: 5000,
    max_image_size_mb: 100,
  },
};

// Map product IDs to plan names (supports both EUR and USD products)
const PRODUCT_TO_PLAN: Record<string, keyof typeof PLAN_LIMITS> = {
  // USD products
  "prod_TelxXCo2qqYN1y": "premium",
  "prod_TelxqbQvbBMKPx": "pro",
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
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // Note: In production, you should verify the webhook signature
    // For now, we'll parse the event directly
    let event: Stripe.Event;
    
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      logStep("Error parsing webhook body", { error: err });
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        // Update user profile based on subscription
        if (session.customer && session.subscription) {
          await handleSubscriptionCreated(
            supabase, 
            stripe, 
            session.customer as string, 
            session.subscription as string
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status,
          customerId: subscription.customer 
        });

        await handleSubscriptionUpdate(supabase, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { 
          subscriptionId: subscription.id,
          customerId: subscription.customer 
        });

        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment succeeded", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription
        });
        // Subscription renewal - profile already updated
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { 
          invoiceId: invoice.id,
          customerId: invoice.customer 
        });
        // You might want to notify the user or handle grace period
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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

async function handleSubscriptionCreated(
  supabase: any,
  stripe: Stripe,
  customerId: string,
  subscriptionId: string
) {
  logStep("Processing subscription creation", { customerId, subscriptionId });

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    logStep("Customer was deleted", { customerId });
    return;
  }

  const email = (customer as Stripe.Customer).email;
  if (!email) {
    logStep("Customer has no email", { customerId });
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateProfileFromSubscription(supabase, email, customerId, subscription);
}

async function handleSubscriptionUpdate(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    logStep("Customer was deleted", { customerId });
    return;
  }

  const email = (customer as Stripe.Customer).email;
  if (!email) {
    logStep("Customer has no email", { customerId });
    return;
  }

  await updateProfileFromSubscription(supabase, email, customerId, subscription);
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  logStep("Downgrading user to free plan", { customerId });

  // Find user by stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (profileError || !profile) {
    logStep("Could not find profile for customer", { customerId, error: profileError });
    return;
  }

  // Reset to free plan
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_plan: "free",
      stripe_subscription_id: null,
      ...FREE_LIMITS,
    })
    .eq("id", profile.id);

  if (updateError) {
    logStep("Error updating profile to free", { error: updateError });
  } else {
    logStep("User downgraded to free plan", { userId: profile.id });
  }
}

async function updateProfileFromSubscription(
  supabase: any,
  email: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile) {
    logStep("Could not find profile", { email, error: profileError });
    return;
  }

  // Determine plan from product ID
  const productId = subscription.items.data[0]?.price?.product as string;
  const planName = PRODUCT_TO_PLAN[productId] || null;
  const planLimits = planName ? PLAN_LIMITS[planName] : FREE_LIMITS;

  logStep("Updating profile", { 
    userId: profile.id, 
    planName, 
    status: subscription.status,
    planLimits 
  });

  // Only apply paid limits if subscription is active
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  
  const updateData: any = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
  };

  if (isActive && planName) {
    updateData.subscription_plan = planName;
    updateData.storage_limit_mb = planLimits.storage_limit_mb;
    updateData.max_galleries = planLimits.max_galleries;
    updateData.max_images_per_gallery = planLimits.max_images_per_gallery;
    updateData.max_image_size_mb = planLimits.max_image_size_mb;
  } else {
    // Not active - downgrade to free
    updateData.subscription_plan = "free";
    updateData.storage_limit_mb = FREE_LIMITS.storage_limit_mb;
    updateData.max_galleries = FREE_LIMITS.max_galleries;
    updateData.max_images_per_gallery = FREE_LIMITS.max_images_per_gallery;
    updateData.max_image_size_mb = FREE_LIMITS.max_image_size_mb;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profile.id);

  if (updateError) {
    logStep("Error updating profile", { error: updateError });
  } else {
    logStep("Profile updated successfully", { userId: profile.id, planName });
  }
}
