# Create Verification Email Template

Write-Host "Creation du template d'email de verification..." -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://cccykchoteodrvabxaqq.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3lrY2hvdGVvZHJ2YWJ4YXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1NTEwMSwiZXhwIjoyMDgyNTMxMTAxfQ.yi6iKi2D1QIG2zc24ETlcZRlbv1jZ4e-lEo8QGRPBu4"

$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$currentYear = (Get-Date).Year

$template = @{
    name = "Account Verification Email"
    slug = "account-verification"
    subject = "Verify your {{appName}} email address"
    html_content = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: white;
      margin-bottom: 10px;
    }
    .header-text {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 20px 0;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 30px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .divider {
      margin: 30px 0;
      border: 0;
      border-top: 1px solid #e2e8f0;
    }
    .alternative {
      font-size: 14px;
      color: #64748b;
      margin: 20px 0;
    }
    .link {
      color: #667eea;
      word-break: break-all;
      text-decoration: none;
    }
    .expiry {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .expiry-text {
      font-size: 14px;
      color: #92400e;
      margin: 0;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 14px;
      color: #64748b;
      margin: 5px 0;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
    }
    .security-notice {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .security-title {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin: 0 0 8px 0;
    }
    .security-text {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">{{appName}}</div>
        <p class="header-text">Welcome to our platform!</p>
      </div>
      <div class="content">
        <h1 class="greeting">Hi {{userName}},</h1>
        <p class="message">
          Thank you for signing up! We're excited to have you on board. 
          To get started, please verify your email address by clicking the button below.
        </p>
        <div class="button-container">
          <a href="{{verificationLink}}" class="button">
            Verify Email Address
          </a>
        </div>
        <div class="expiry">
          <p class="expiry-text">
            ⏰ This verification link will expire in {{expiresIn}}.
          </p>
        </div>
        <hr class="divider">
        <p class="alternative">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p class="alternative">
          <a href="{{verificationLink}}" class="link">{{verificationLink}}</a>
        </p>
        <div class="security-notice">
          <p class="security-title">🔒 Security Notice</p>
          <p class="security-text">
            If you didn't create an account with {{appName}}, you can safely ignore this email. 
            Your email address will not be used without verification.
          </p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="{{supportUrl}}" class="footer-link">Contact our support team</a>
        </p>
        <p class="footer-text">
          © {{currentYear}} {{appName}}. All rights reserved.
        </p>
        <p class="footer-text">
          <a href="{{privacyUrl}}" class="footer-link">Privacy Policy</a> • 
          <a href="{{termsUrl}}" class="footer-link">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
"@
    text_content = @"
Hi {{userName}},

Thank you for signing up for {{appName}}! We're excited to have you on board.

To get started, please verify your email address by clicking the link below:

{{verificationLink}}

⏰ This verification link will expire in {{expiresIn}}.

If you didn't create an account with {{appName}}, you can safely ignore this email.

Need help? Contact our support team at {{supportUrl}}

© {{currentYear}} {{appName}}. All rights reserved.
"@
    type = "transactional"
    source = "system"
    variables = @("userName", "userEmail", "appName", "verificationLink", "expiresIn", "supportUrl", "privacyUrl", "termsUrl", "currentYear")
    is_active = $true
    active_version = 1
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Insertion du template dans la base de donnees..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/email_templates" -Headers $headers -Method Post -Body $template
    
    Write-Host ""
    Write-Host "Template cree avec succes!" -ForegroundColor Green
    Write-Host "ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Slug: $($response.slug)" -ForegroundColor Cyan
    Write-Host "Name: $($response.name)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Variables disponibles:" -ForegroundColor Yellow
    Write-Host "  - userName: Nom de l'utilisateur" -ForegroundColor Gray
    Write-Host "  - userEmail: Email de l'utilisateur" -ForegroundColor Gray
    Write-Host "  - appName: Nom de l'application (PikSend)" -ForegroundColor Gray
    Write-Host "  - verificationLink: Lien de verification" -ForegroundColor Gray
    Write-Host "  - expiresIn: Duree de validite (24 hours)" -ForegroundColor Gray
    Write-Host "  - supportUrl: URL du support" -ForegroundColor Gray
    Write-Host "  - privacyUrl: URL de la politique de confidentialite" -ForegroundColor Gray
    Write-Host "  - termsUrl: URL des conditions d'utilisation" -ForegroundColor Gray
    Write-Host "  - currentYear: Annee actuelle" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Vous pouvez maintenant utiliser ce template dans le code!" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
