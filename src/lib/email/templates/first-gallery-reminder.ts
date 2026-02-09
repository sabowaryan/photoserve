/**
 * First Gallery Reminder Email Template
 * Sent D+1 if user hasn't created a gallery
 * Requirements: 18.2, 18.3
 */

export interface FirstGalleryReminderVariables {
  firstName?: string;
  email: string;
}

export function getFirstGalleryReminderSubject(): string {
  return 'Comment créer votre première galerie PikSend';
}

export function getFirstGalleryReminderHtml(variables: FirstGalleryReminderVariables): string {
  const { firstName, email } = variables;
  const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Créez votre première galerie</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #111827;">
                PikSend
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #111827;">
                ${greeting},
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Nous avons remarqué que vous n'avez pas encore créé votre première galerie. Pas de souci ! Nous sommes là pour vous aider.
              </p>
              
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Créer une galerie sur PikSend est <strong>simple et rapide</strong> :
              </p>
              
              <div style="margin: 32px 0; padding: 24px; background-color: #f3f4f6; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #111827;">
                  En 3 étapes simples :
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 12px;">
                    <strong>Uploadez vos photos</strong> - Glissez-déposez vos images
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong>Personnalisez</strong> - Ajoutez un titre et un mot de passe
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong>Partagez</strong> - Envoyez le lien à votre client
                  </li>
                </ol>
              </div>
              
              <div style="margin: 32px 0; padding: 20px; background-color: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #1e40af;">
                  💡 <strong>Astuce :</strong> Votre première galerie est gratuite et prend moins de 5 minutes à créer !
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/galleries/new" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Créer ma première galerie
                </a>
              </div>
              
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Besoin d'aide ? Répondez à cet email et nous vous guiderons pas à pas.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} PikSend. Tous droits réservés.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getFirstGalleryReminderText(variables: FirstGalleryReminderVariables): string {
  const { firstName } = variables;
  const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';

  return `
${greeting},

Nous avons remarqué que vous n'avez pas encore créé votre première galerie. Pas de souci ! Nous sommes là pour vous aider.

Créer une galerie sur PikSend est simple et rapide :

En 3 étapes simples :
1. Uploadez vos photos - Glissez-déposez vos images
2. Personnalisez - Ajoutez un titre et un mot de passe
3. Partagez - Envoyez le lien à votre client

💡 Astuce : Votre première galerie est gratuite et prend moins de 5 minutes à créer !

Créez votre première galerie : ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/galleries/new

Besoin d'aide ? Répondez à cet email et nous vous guiderons pas à pas.

© ${new Date().getFullYear()} PikSend. Tous droits réservés.
  `.trim();
}
