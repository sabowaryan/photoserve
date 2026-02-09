# ============================================================================
# Email Management System - Production Deployment Script (PowerShell)
# ============================================================================
# This script automates the deployment of the email management system to
# production, including database migrations, edge functions, and verification.
#
# Usage:
#   .\scripts\deploy-email-system.ps1 [-SkipMigrations] [-SkipFunctions] [-DryRun]
#
# Options:
#   -SkipMigrations   Skip database migration step
#   -SkipFunctions    Skip edge function deployment
#   -DryRun          Show what would be done without executing
#
# Requirements: 12.3, 12.4
# ============================================================================

param(
    [switch]$SkipMigrations,
    [switch]$SkipFunctions,
    [switch]$DryRun
)

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host $Message -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

function Confirm-Action {
    param([string]$Message)
    
    if ($DryRun) {
        return $true
    }
    
    $response = Read-Host "$Message (y/n)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Error "Deployment cancelled by user"
        exit 1
    }
    return $true
}

function Test-Command {
    param([string]$Command)
    
    $exists = Get-Command $Command -ErrorAction SilentlyContinue
    if (-not $exists) {
        Write-Error "$Command is not installed. Please install it first."
        exit 1
    }
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

Write-Step "Step 0: Pre-flight Checks"

# Check required commands
Write-Info "Checking required commands..."
Test-Command "supabase"
Test-Command "curl"
Write-Success "All required commands are available"

# Check if Supabase is linked
Write-Info "Checking Supabase project link..."
try {
    $null = supabase projects list 2>&1
} catch {
    Write-Error "Not logged in to Supabase. Run: supabase login"
    exit 1
}

# Get linked project
$statusOutput = supabase status 2>&1 | Out-String
$projectRef = if ($statusOutput -match "Project ref:\s+(\S+)") { $matches[1] } else { $null }

if (-not $projectRef) {
    Write-Error "No Supabase project linked. Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
}

Write-Success "Linked to Supabase project: $projectRef"

# Check environment variables
Write-Info "Checking environment variables..."
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Make sure environment variables are set."
}

# Confirm deployment
Write-Host ""
Write-Warning "You are about to deploy the Email Management System to PRODUCTION"
Write-Warning "Project: $projectRef"
Write-Host ""
Confirm-Action "Are you sure you want to continue?"

# ============================================================================
# Step 1: Database Migrations
# ============================================================================

if (-not $SkipMigrations) {
    Write-Step "Step 1: Database Migrations"
    
    Write-Info "Checking migration status..."
    if ($DryRun) {
        Write-Info "[DRY RUN] Would check: supabase db remote list"
    } else {
        supabase db remote list
    }
    
    Write-Host ""
    Confirm-Action "Apply all pending migrations to production?"
    
    Write-Info "Applying migrations..."
    if ($DryRun) {
        Write-Info "[DRY RUN] Would run: supabase db push"
    } else {
        supabase db push
    }
    
    Write-Success "Database migrations applied successfully"
    
    # Verify email tables were created
    Write-Info "Verifying email tables..."
    if (-not $DryRun) {
        $query = @"
SELECT COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%';
"@
        
        $result = supabase db remote exec $query
        $tableCount = if ($result -match '\d+') { [int]$matches[0] } else { 0 }
        
        if ($tableCount -ge 9) {
            Write-Success "Email tables verified ($tableCount tables found)"
        } else {
            Write-Error "Email tables not found or incomplete ($tableCount tables found, expected 9)"
            exit 1
        }
    }
} else {
    Write-Warning "Skipping database migrations (-SkipMigrations flag)"
}

# ============================================================================
# Step 2: Deploy Edge Functions
# ============================================================================

if (-not $SkipFunctions) {
    Write-Step "Step 2: Deploy Edge Functions"
    
    Write-Info "Deploying process-email-queue edge function..."
    if ($DryRun) {
        Write-Info "[DRY RUN] Would run: supabase functions deploy process-email-queue"
    } else {
        supabase functions deploy process-email-queue
    }
    
    Write-Success "Edge function deployed successfully"
    
    # List deployed functions
    Write-Info "Verifying deployed functions..."
    if (-not $DryRun) {
        supabase functions list
    }
} else {
    Write-Warning "Skipping edge function deployment (-SkipFunctions flag)"
}

# ============================================================================
# Step 3: Configuration Instructions
# ============================================================================

Write-Step "Step 3: Manual Configuration Required"

Write-Host ""
Write-Warning "The following steps must be completed manually:"
Write-Host ""

Write-Host "1. Configure Cron Trigger for Email Queue Processing:"
Write-Host "   - Go to Supabase Dashboard → Edge Functions → process-email-queue"
Write-Host "   - Click Settings → Cron"
Write-Host "   - Set schedule: * * * * * (every minute)"
Write-Host "   - Save"
Write-Host ""

Write-Host "2. Configure Email Provider in Admin UI:"
Write-Host "   - Go to: https://your-domain.com/admin/emails/providers"
Write-Host "   - Select provider (Resend or AWS SES)"
Write-Host "   - Enter production API credentials"
Write-Host "   - Test connection"
Write-Host ""

Write-Host "3. Add and Verify Sender Address:"
Write-Host "   - Go to: https://your-domain.com/admin/emails/senders"
Write-Host "   - Add sender email address"
Write-Host "   - Follow DNS verification instructions"
Write-Host "   - Add DKIM, SPF, and DMARC records"
Write-Host ""

Write-Host "4. Configure Webhooks:"
Write-Host ""
Write-Host "   For Resend:"
Write-Host "   - Go to: https://resend.com/webhooks"
Write-Host "   - Add webhook URL: https://your-domain.com/api/webhooks/email/resend"
Write-Host "   - Select events: sent, delivered, bounced, complained, opened, clicked"
Write-Host ""
Write-Host "   For AWS SES:"
Write-Host "   - Create SNS topic: aws sns create-topic --name email-events-production"
Write-Host "   - Configure SES event destination"
Write-Host "   - Subscribe webhook endpoint to SNS topic"
Write-Host ""

Write-Host "5. Set Up Monitoring and Alerting:"
Write-Host "   - Configure alerts for queue depth > 500"
Write-Host "   - Configure alerts for failure rate > 10%"
Write-Host "   - Configure alerts for bounce rate > 10%"
Write-Host "   - Set up error tracking (Sentry, Datadog, etc.)"
Write-Host ""

# ============================================================================
# Step 4: Testing Instructions
# ============================================================================

Write-Step "Step 4: Testing Instructions"

Write-Host ""
Write-Info "After completing manual configuration, test the system:"
Write-Host ""

Write-Host "1. Send a test email using PowerShell:"
Write-Host @"
`$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer YOUR_AUTH_TOKEN'
}

`$body = @{
    templateId = 'purchase-confirmation'
    to = 'your-test-email@example.com'
    variables = @{
        buyerName = 'Test User'
        galleryName = 'Test Gallery'
        photoCount = 5
        amountPaid = '`$50.00'
        transactionId = 'test_123'
        purchaseDate = '2026-02-06'
        accessLink = 'https://your-domain.com/gallery/test'
        photographerName = 'Test Photographer'
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://your-domain.com/api/emails/send' ``
    -Method Post ``
    -Headers `$headers ``
    -Body `$body
"@
Write-Host ""

Write-Host "2. Verify email delivery:"
Write-Host "   - Check that email was received"
Write-Host "   - Verify email content renders correctly"
Write-Host "   - Check email logs: https://your-domain.com/admin/emails/logs"
Write-Host "   - Verify webhook events are being received"
Write-Host ""

Write-Host "3. Monitor queue processing:"
Write-Host "   - Check edge function logs: supabase functions logs process-email-queue --tail"
Write-Host "   - Monitor queue depth in admin UI"
Write-Host "   - Verify emails are processed within 1-2 minutes"
Write-Host ""

# ============================================================================
# Step 5: Monitoring Queries
# ============================================================================

Write-Step "Step 5: Monitoring Queries"

Write-Host ""
Write-Info "Use these SQL queries to monitor the email system:"
Write-Host ""

Write-Host @"
-- Queue depth
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Recent failures (last hour)
SELECT COUNT(*) as failed_count
FROM email_queue
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '1 hour';

-- Delivery rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as delivery_rate_percent
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours';
"@
Write-Host ""

# ============================================================================
# Completion
# ============================================================================

Write-Step "Deployment Complete"

Write-Host ""
Write-Success "Email Management System deployment script completed!"
Write-Host ""
Write-Warning "Next steps:"
Write-Host "  1. Complete manual configuration steps above"
Write-Host "  2. Test email sending with test emails"
Write-Host "  3. Monitor for 24-48 hours"
Write-Host "  4. Set up alerting for critical failures"
Write-Host ""
Write-Info "For detailed instructions, see:"
Write-Host "  docs/deployment/email-system-production-deployment.md"
Write-Host ""
