# Template d'Email de Vérification de Compte

Ce document contient toutes les informations nécessaires pour créer le template d'email de vérification de compte dans PikSend.

## Informations du Template

### Paramètres de Base

- **Nom**: Account Verification Email
- **Slug**: `account-verification`
- **Sujet**: `Verify your {{appName}} email address`
- **Type**: Transactional
- **Source**: System
- **Statut**: Active
- **Version**: 1

### Variables Disponibles

Le template utilise les variables suivantes (à remplacer lors de l'envoi):

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{userName}}` | Nom de l'utilisateur | "John Doe" |
| `{{userEmail}}` | Email de l'utilisateur | "john@example.com" |
| `{{appName}}` | Nom de l'application | "PikSend" |
| `{{verificationLink}}` | Lien de vérification complet | "https://piksend.com/verify-email/confirm?token=..." |
| `{{expiresIn}}` | Durée de validité du lien | "24 hours" |
| `{{supportUrl}}` | URL du support | "https://piksend.com/support" |
| `{{privacyUrl}}` | URL politique de confidentialité | "https://piksend.com/privacy" |
| `{{termsUrl}}` | URL conditions d'utilisation | "https://piksend.com/terms" |
| `{{currentYear}}` | Année actuelle | "2026" |

## Design du Template

### Caractéristiques Visuelles

- **Couleurs principales**: Gradient violet (#667eea → #764ba2)
- **Police**: System fonts (Apple, Segoe UI, Roboto)
- **Largeur maximale**: 600px
- **Style**: Moderne, épuré, professionnel
- **Responsive**: Optimisé pour mobile et desktop

### Sections du Template

1. **Header avec gradient**
   - Logo de l'application
   - Message de bienvenue

2. **Contenu principal**
   - Salutation personnalisée
   - Message d'accueil
   - Bouton CTA principal "Verify Email Address"
   - Notice d'expiration (avec fond jaune)

3. **Lien alternatif**
   - Lien texte pour copier/coller
   - Utile si le bouton ne fonctionne pas

4. **Notice de sécurité**
   - Fond gris clair
   - Icône de cadenas
   - Message de sécurité

5. **Footer**
   - Lien vers le support
   - Copyright
   - Liens vers Privacy Policy et Terms

## Contenu HTML

Le contenu HTML complet est disponible dans le fichier `verification-template.json`.

### Aperçu du Contenu Texte

```
Hi {{userName}},

Thank you for signing up for {{appName}}! We're excited to have you on board.

To get started, please verify your email address by clicking the link below:

{{verificationLink}}

⏰ This verification link will expire in {{expiresIn}}.

If you didn't create an account with {{appName}}, you can safely ignore this email.

Need help? Contact our support team at {{supportUrl}}

© {{currentYear}} {{appName}}. All rights reserved.
```

## Utilisation dans le Code

### Exemple d'Envoi

```typescript
import { EmailService } from '@/lib/services/email.service';
import { createTemplateRenderer } from '@/lib/email/template-renderer';

const emailService = new EmailService(supabase);
const templateRenderer = createTemplateRenderer(supabase);

// Rendre le template avec les variables
const rendered = await templateRenderer.renderBySlug('account-verification', {
  userName: user.name || 'there',
  userEmail: user.email,
  appName: 'PikSend',
  verificationLink: `${baseUrl}/verify-email/confirm?token=${token}`,
  expiresIn: '24 hours',
  supportUrl: `${baseUrl}/support`,
  privacyUrl: `${baseUrl}/privacy`,
  termsUrl: `${baseUrl}/terms`,
  currentYear: new Date().getFullYear().toString(),
});

// Envoyer l'email
await emailService.sendTransactionalEmail({
  to: user.email,
  subject: rendered.subject,
  html: rendered.html,
  text: rendered.text,
  type: 'transactional',
  priority: 'high',
});
```

## Création du Template

### Option 1: Via l'Interface Admin

1. Accédez à `/admin/emails/templates`
2. Cliquez sur "Create Template"
3. Remplissez les champs avec les informations ci-dessus
4. Copiez le contenu HTML depuis `verification-template.json`
5. Ajoutez les variables dans la section appropriée
6. Sauvegardez et publiez

### Option 2: Via SQL

Exécutez le fichier `scripts/create-verification-email-template.sql` dans votre base de données Supabase.

### Option 3: Via l'API

Utilisez le fichier `verification-template.json` avec l'API REST de Supabase:

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/rest/v1/email_templates" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d @verification-template.json
```

## Intégration avec le Service de Vérification

Pour utiliser ce template dans le service de vérification d'email existant, modifiez `src/lib/services/email-verification.service.ts`:

```typescript
// Au lieu de render(VerificationEmail(...))
const templateRenderer = createTemplateRenderer(this.supabase);
const rendered = await templateRenderer.renderBySlug('account-verification', {
  userName: params.name || 'there',
  userEmail: params.email,
  appName: 'PikSend',
  verificationLink: `${params.baseUrl}/verify-email/confirm?token=${params.token}`,
  expiresIn: '24 hours',
  supportUrl: `${params.baseUrl}/support`,
  privacyUrl: `${params.baseUrl}/privacy`,
  termsUrl: `${params.baseUrl}/terms`,
  currentYear: new Date().getFullYear().toString(),
});

// Puis utiliser rendered.html au lieu de html
```

## Tests

Pour tester le template:

1. Créez un nouveau compte
2. Vérifiez que l'email de vérification est bien reçu
3. Vérifiez que le design s'affiche correctement
4. Testez le bouton de vérification
5. Testez le lien alternatif
6. Vérifiez la version mobile

## Notes

- Le template est optimisé pour tous les clients email (Gmail, Outlook, Apple Mail, etc.)
- Les styles inline garantissent une compatibilité maximale
- Le template est accessible (WCAG 2.1 AA)
- Le contenu texte est fourni pour les clients email qui ne supportent pas le HTML
