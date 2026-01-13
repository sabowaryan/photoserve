import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// No CORS needed for webhooks - they are server-to-server from Stripe
// Only stripe-signature header is relevant for webhook verification

// Plan configuration matching the app pricing (src/config/plans.ts)
// IMPORTANT: Keep in sync with src/config/plans.ts
// Supports both EUR and USD product IDs
const PLAN_LIMITS = {
  premium: {
    storage_limit_mb: 5120, // 5 Go
    max_galleries: 50,
    max_images_per_gallery: 500,
    max_image_size_mb: 50,
    max_expiration_days: 90,
  },
  pro: {
    storage_limit_mb: 51200, // 50 Go
    max_galleries: 500,
    max_images_per_gallery: 5000,
    max_image_size_mb: 100,
    max_expiration_days: 180,
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
  max_expiration_days: 14,
};

// Gallery unlock price in cents ($2.99)
const GALLERY_UNLOCK_PRICE_CENTS = 299;

// Gallery unlock expiration extension (30 days)
const GALLERY_UNLOCK_EXPIRATION_DAYS = 30;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Webhooks don't need CORS - they come from Stripe servers, not browsers
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
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

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logStep("Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata
        });

        // Check if this is a gallery unlock payment
        if (session.metadata?.type === 'gallery_unlock') {
          await handleGalleryUnlockPayment(supabase, session);
        }
        // Check if this is a guest subscription
        else if (session.metadata?.type === 'guest_subscription') {
          // Guest subscription - will be handled when user creates account
          // The subscription is created but not yet linked to a user
          logStep("Guest subscription created", {
            guestSessionId: session.metadata.guest_session_id,
            subscriptionId: session.subscription
          });
          
          // If there's a customer and subscription, handle it
          if (session.customer && session.subscription) {
            await handleSubscriptionCreated(
              supabase, 
              stripe, 
              session.customer as string, 
              session.subscription as string
            );
          }
        }
        // Regular subscription checkout
        else if (session.customer && session.subscription) {
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
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Return generic error to client, details are logged server-side only
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      headers: { "Content-Type": "application/json" },
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

/**
 * Handle gallery unlock payment
 * Updates gallery: is_unlocked=true, expires_at=+30 days
 * Creates gallery_payments record
 * 
 * Requirements: 4.2
 */
async function handleGalleryUnlockPayment(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const galleryId = session.metadata?.gallery_id;
  const guestSessionId = session.metadata?.guest_session_id;
  const paymentIntentId = session.payment_intent as string;

  logStep("Processing gallery unlock payment", { 
    galleryId, 
    guestSessionId,
    paymentIntentId 
  });

  if (!galleryId) {
    logStep("No gallery_id in metadata");
    return;
  }

  // Verify gallery exists
  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id, is_unlocked, guest_session_id")
    .eq("id", galleryId)
    .single();

  if (galleryError || !gallery) {
    logStep("Gallery not found", { galleryId, error: galleryError });
    return;
  }

  // Check if already unlocked (idempotency)
  if (gallery.is_unlocked) {
    logStep("Gallery already unlocked", { galleryId });
    return;
  }

  // Calculate new expiration date (30 days from now)
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + GALLERY_UNLOCK_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  // Update gallery: is_unlocked=true, expires_at=+30 days, payment_type='one_time'
  const { error: updateError } = await supabase
    .from("galleries")
    .update({
      is_unlocked: true,
      payment_type: "one_time",
      expires_at: newExpiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", galleryId);

  if (updateError) {
    logStep("Error updating gallery", { galleryId, error: updateError });
    return;
  }

  logStep("Gallery unlocked successfully", { 
    galleryId, 
    newExpiresAt: newExpiresAt.toISOString() 
  });

  // Create gallery_payments record
  if (paymentIntentId) {
    const { error: paymentError } = await supabase
      .from("gallery_payments")
      .insert({
        gallery_id: galleryId,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: GALLERY_UNLOCK_PRICE_CENTS,
        currency: "usd",
        status: "succeeded",
      });

    if (paymentError) {
      logStep("Error creating payment record", { error: paymentError });
    } else {
      logStep("Payment record created", { galleryId, paymentIntentId });
    }
  }
}
