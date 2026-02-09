-- Create Email Verification Template
-- This template is used for sending account verification emails to new users

INSERT INTO email_templates (
  name,
  slug,
  subject,
  html_content,
  text_content,
  type,
  source,
  variables,
  is_active,
  active_version,
  created_at,
  updated_at
) VALUES (
  'Account Verification Email',
  'account-verification',
  'Verify your {{appName}} email address',
  '<!DOCTYPE html>
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
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
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
      <!-- Header -->
      <div class="header">
        <div class="logo">{{appName}}</div>
        <p class="header-text">Welcome to our platform!</p>
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="greeting">Hi {{userName}},</h1>
        
        <p class="message">
          Thank you for signing up! We''re excited to have you on board. 
          To get started, please verify your email address by clicking the button below.
        </p>

        <!-- Verification Button -->
        <div class="button-container">
          <a href="{{verificationLink}}" class="button">
            Verify Email Address
          </a>
        </div>

        <!-- Expiry Notice -->
        <div class="expiry">
          <p class="expiry-text">
            ⏰ This verification link will expire in {{expiresIn}}.
          </p>
        </div>

        <hr class="divider">

        <!-- Alternative Link -->
        <p class="alternative">
          If the button doesn''t work, copy and paste this link into your browser:
        </p>
        <p class="alternative">
          <a href="{{verificationLink}}" class="link">{{verificationLink}}</a>
        </p>

        <!-- Security Notice -->
        <div class="security-notice">
          <p class="security-title">🔒 Security Notice</p>
          <p class="security-text">
            If you didn''t create an account with {{appName}}, you can safely ignore this email. 
            Your email address will not be used without verification.
          </p>
        </div>
      </div>

      <!-- Footer -->
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
</html>',
  'Hi {{userName}},

Thank you for signing up for {{appName}}! We''re excited to have you on board.

To get started, please verify your email address by clicking the link below:

{{verificationLink}}

⏰ This verification link will expire in {{expiresIn}}.

If you didn''t create an account with {{appName}}, you can safely ignore this email.

Need help? Contact our support team at {{supportUrl}}

© {{currentYear}} {{appName}}. All rights reserved.',
  'transactional',
  'system',
  ARRAY['userName', 'userEmail', 'appName', 'verificationLink', 'expiresIn', 'supportUrl', 'privacyUrl', 'termsUrl', 'currentYear'],
  true,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
