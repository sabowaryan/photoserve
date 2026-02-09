-- Seed Email Templates for Conversion Funnel
-- Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7

-- Welcome Email Template (Transactional)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'welcome-email',
  'Email de Bienvenue',
  'transactional',
  'custom',
  'Bienvenue sur PikSend ! 🎉',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #111827;">PikSend</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #111827;">
                {{ firstName ? `Bonjour ${firstName}` : ''Bonjour'' }} ! 👋
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Bienvenue sur PikSend ! Nous sommes ravis de vous compter parmi nous.
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                PikSend vous permet de <strong>livrer vos photos en 5 minutes</strong>, de <strong>vendre vos galeries</strong> et de <strong>garder 90%</strong> de vos revenus.
              </p>
              <div style="margin: 32px 0; padding: 24px; background-color: #f3f4f6; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #111827;">Pour commencer :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 12px;"><strong>Créez votre première galerie</strong> en quelques clics</li>
                  <li style="margin-bottom: 12px;"><strong>Personnalisez votre profil</strong> avec votre logo</li>
                  <li style="margin-bottom: 12px;"><strong>Partagez avec vos clients</strong> et commencez à vendre</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Accéder à mon dashboard
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
                Besoin d''aide ? Notre équipe est là pour vous. Répondez simplement à cet email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2024 PikSend. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- First Gallery Reminder Email (D+1) (Marketing)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'first-gallery-reminder-d1',
  'Rappel Première Galerie - J+1',
  'marketing',
  'custom',
  'Comment créer votre première galerie',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #111827;">
                {{ firstName ? `${firstName}, prêt` : ''Prêt'' }} à créer votre première galerie ?
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Nous avons remarqué que vous n''avez pas encore créé de galerie. C''est très simple et ça ne prend que <strong>5 minutes</strong> !
              </p>
              <div style="margin: 24px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; font-size: 18px; color: #1e40af;">3 étapes simples :</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Uploadez vos photos</li>
                  <li style="margin-bottom: 8px;">Personnalisez votre galerie</li>
                  <li style="margin-bottom: 8px;">Partagez avec vos clients</li>
                </ol>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Créer ma première galerie
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="{{APP_URL}}/unsubscribe?email={{email}}" style="color: #6b7280; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- Help Email (D+3) (Marketing)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'help-email-d3',
  'Email d''Aide - J+3',
  'marketing',
  'custom',
  'Besoin d''aide pour démarrer ?',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #111827;">
                {{ firstName ? `${firstName}, besoin` : ''Besoin'' }} d''un coup de main ?
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Nous sommes là pour vous aider à démarrer avec PikSend. Voici quelques ressources utiles :
              </p>
              <div style="margin: 24px 0;">
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                  <h3 style="margin: 0 0 8px; font-size: 16px; color: #111827;">📚 Guide de démarrage</h3>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">Apprenez les bases en 5 minutes</p>
                </div>
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                  <h3 style="margin: 0 0 8px; font-size: 16px; color: #111827;">💬 Support en direct</h3>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">Répondez à cet email, nous sommes là</p>
                </div>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Commencer maintenant
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="{{APP_URL}}/unsubscribe?email={{email}}" style="color: #6b7280; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- Upgrade Email (D+7) (Marketing)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'upgrade-email-d7',
  'Email Upgrade - J+7',
  'marketing',
  'custom',
  'Prêt pour Premium ?',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #111827;">
                Débloquez tout le potentiel de PikSend
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Vous utilisez PikSend depuis une semaine. Il est temps de passer à la vitesse supérieure !
              </p>
              <div style="margin: 24px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; font-size: 18px; color: #166534;">Avec Premium, vous débloquez :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">100 galeries par mois</li>
                  <li style="margin-bottom: 8px;">Téléchargement ZIP pour vos clients</li>
                  <li style="margin-bottom: 8px;">Branding personnalisé</li>
                  <li style="margin-bottom: 8px;">Support prioritaire</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <p style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827;">
                  Seulement 9,99€/mois
                </p>
                <a href="{{APP_URL}}/pricing" style="display: inline-block; padding: 14px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Essayer 14 jours gratuits
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="{{APP_URL}}/unsubscribe?email={{email}}" style="color: #6b7280; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- Upgrade Email (D+14) (Marketing)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'upgrade-email-d14',
  'Email Upgrade - J+14',
  'marketing',
  'custom',
  'Voici ce que vous manquez',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #111827;">
                {{ firstName ? `${firstName}, découvrez` : ''Découvrez'' }} ce que vous manquez
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Après 2 semaines avec PikSend, vous avez vu les bases. Mais il y a tellement plus !
              </p>
              <div style="margin: 24px 0;">
                <div style="margin-bottom: 16px; padding: 16px; border-left: 4px solid #2563eb; background-color: #eff6ff;">
                  <h3 style="margin: 0 0 8px; font-size: 16px; color: #1e40af;">💼 Professionnalisez votre image</h3>
                  <p style="margin: 0; font-size: 14px; color: #374151;">Logo personnalisé, domaine custom, branding complet</p>
                </div>
                <div style="margin-bottom: 16px; padding: 16px; border-left: 4px solid #16a34a; background-color: #f0fdf4;">
                  <h3 style="margin: 0 0 8px; font-size: 16px; color: #166534;">📈 Augmentez vos ventes</h3>
                  <p style="margin: 0; font-size: 14px; color: #374151;">Galeries illimitées, analytics avancés, intégration Lightroom</p>
                </div>
                <div style="margin-bottom: 16px; padding: 16px; border-left: 4px solid #dc2626; background-color: #fef2f2;">
                  <h3 style="margin: 0 0 8px; font-size: 16px; color: #991b1b;">⚡ Gagnez du temps</h3>
                  <p style="margin: 0; font-size: 14px; color: #374151;">Upload automatique, templates, support prioritaire</p>
                </div>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/pricing" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Voir les plans Premium
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="{{APP_URL}}/unsubscribe?email={{email}}" style="color: #6b7280; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- First Gallery Congratulations Email (Transactional)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'first-gallery-congrats',
  'Félicitations Première Galerie',
  'transactional',
  'custom',
  '🎉 Félicitations pour votre première galerie !',
  '["firstName", "email"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
              <h2 style="margin: 0 0 20px; font-size: 28px; color: #111827;">
                Bravo {{ firstName }} !
              </h2>
              <p style="margin: 0 0 16px; font-size: 18px; line-height: 28px; color: #374151;">
                Vous venez de créer votre première galerie PikSend !
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #6b7280;">
                C''est une étape importante. Vous êtes maintenant prêt à partager vos photos avec vos clients et à commencer à vendre.
              </p>
              <div style="margin: 32px 0; padding: 24px; background-color: #fef3c7; border-radius: 8px; text-align: left;">
                <h3 style="margin: 0 0 16px; font-size: 18px; color: #92400e;">Prochaines étapes :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px;">Partagez le lien avec votre client</li>
                  <li style="margin-bottom: 8px;">Personnalisez votre profil avec votre logo</li>
                  <li style="margin-bottom: 8px;">Explorez les fonctionnalités Premium</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Voir ma galerie
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();


-- Upgrade Confirmation Email (Transactional)
INSERT INTO email_templates (
  slug,
  name,
  type,
  source,
  subject,
  variables,
  content,
  is_active,
  active_version
) VALUES (
  'upgrade-confirmation',
  'Confirmation Upgrade',
  'transactional',
  'custom',
  'Bienvenue dans {{planName}} ! 🚀',
  '["firstName", "email", "planName", "price"]'::jsonb,
  jsonb_build_object(
    'html', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                <h2 style="margin: 0; font-size: 28px; color: #111827;">
                  Bienvenue dans {{planName}} !
                </h2>
              </div>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                {{ firstName ? `${firstName}, merci` : ''Merci'' }} d''avoir choisi {{planName}}. Votre abonnement est maintenant actif !
              </p>
              <div style="margin: 24px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; font-size: 18px; color: #166534;">Récapitulatif de votre abonnement :</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">Plan :</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">{{planName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">Prix :</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">{{price}}€/mois</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">Essai gratuit :</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">14 jours</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 16px 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Vous ne serez pas facturé pendant les 14 premiers jours. Vous pouvez annuler à tout moment depuis votre dashboard.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{APP_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Accéder à mon dashboard
                </a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
                Des questions ? Répondez simplement à cet email, nous sommes là pour vous aider.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
  ),
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  updated_at = NOW();

-- Create initial version records for all templates
INSERT INTO template_versions (template_id, version, subject, content, variables)
SELECT 
  id,
  1,
  subject,
  content,
  variables
FROM email_templates
WHERE slug IN (
  'welcome-email',
  'first-gallery-reminder-d1',
  'help-email-d3',
  'upgrade-email-d7',
  'upgrade-email-d14',
  'first-gallery-congrats',
  'upgrade-confirmation'
)
ON CONFLICT (template_id, version) DO NOTHING;
