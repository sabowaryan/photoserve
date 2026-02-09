import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-EXPIRING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting expiration notification job");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the time window: galleries expiring in the next 24-25 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    logStep("Fetching galleries expiring soon", { 
      from: in24Hours.toISOString(), 
      to: in25Hours.toISOString() 
    });

    // Get galleries expiring in the next 24-25 hours that are still active
    const { data: expiringGalleries, error: galleriesError } = await supabase
      .from("galleries")
      .select(`
        id,
        title,
        unique_slug,
        expires_at,
        user_id
      `)
      .eq("is_active", true)
      .gte("expires_at", in24Hours.toISOString())
      .lt("expires_at", in25Hours.toISOString());

    if (galleriesError) {
      throw new Error(`Failed to fetch expiring galleries: ${galleriesError.message}`);
    }

    logStep("Found expiring galleries", { count: expiringGalleries?.length || 0 });

    if (!expiringGalleries || expiringGalleries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No galleries expiring in the next 24 hours" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(expiringGalleries.map(g => g.user_id))];

    // Fetch user profiles for email addresses
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let emailsQueued = 0;
    let emailErrors = 0;

    // Queue notification emails using the new email management system
    for (const gallery of expiringGalleries) {
      const profile = profileMap.get(gallery.user_id);
      
      if (!profile || !profile.email) {
        logStep("Skipping gallery - no email found", { galleryId: gallery.id });
        continue;
      }

      const expiresAt = new Date(gallery.expires_at);
      const formattedDate = expiresAt.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      try {
        // Queue email using the email management system
        // This will use the configured provider (Resend or AWS SES) and handle retries
        const { error: queueError } = await supabase
          .from("email_queue")
          .insert({
            from_address: "SharePics <onboarding@resend.dev>",
            to_address: profile.email,
            subject: `⏰ Votre galerie "${gallery.title}" expire dans 24 heures`,
            html_content: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">📸 SharePics</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #333; margin-top: 0;">Bonjour ${profile.name || 'cher utilisateur'},</h2>
                  
                  <p style="color: #555;">Votre galerie photo est sur le point d'expirer !</p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #333;">📁 ${gallery.title}</p>
                    <p style="margin: 10px 0 0; color: #888; font-size: 14px;">
                      Expiration : ${formattedDate}
                    </p>
                  </div>
                  
                  <p style="color: #555;">
                    Une fois la galerie expirée, les images seront automatiquement supprimées et ne seront plus accessibles.
                  </p>
                  
                  <p style="color: #555;">
                    <strong>💡 Conseil :</strong> Si vous souhaitez conserver vos images plus longtemps, vous pouvez créer une nouvelle galerie avec une durée d'expiration plus longue ou passer à un abonnement supérieur.
                  </p>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/gallery/${gallery.unique_slug}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Voir ma galerie
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  
                  <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                    Cet email a été envoyé automatiquement par SharePics.<br>
                    Vous recevez cet email car vous avez créé une galerie sur notre plateforme.
                  </p>
                </div>
              </body>
              </html>
            `,
            priority: "normal",
            type: "transactional",
            status: "pending",
            max_retries: 3,
          });

        if (queueError) {
          logStep("Failed to queue email", { galleryId: gallery.id, error: queueError });
          emailErrors++;
        } else {
          logStep("Email queued successfully", { galleryId: gallery.id, email: profile.email });
          emailsQueued++;
        }
      } catch (emailErr) {
        logStep("Email queueing error", { galleryId: gallery.id, error: String(emailErr) });
        emailErrors++;
      }
    }

    const result = {
      message: "Expiration notification job completed",
      galleriesProcessed: expiringGalleries.length,
      emailsQueued,
      emailErrors,
    };

    logStep("Job completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("Error in notification job", { error: error.message });
    // Return generic error to client, details are logged server-side only
    return new Response(
      JSON.stringify({ error: "Notification job failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
