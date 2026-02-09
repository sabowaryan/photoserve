#!/bin/bash

# ============================================================================
# Email Management System - Production Deployment Script
# ============================================================================
# This script automates the deployment of the email management system to
# production, including database migrations, edge functions, and verification.
#
# Usage:
#   ./scripts/deploy-email-system.sh [--skip-migrations] [--skip-functions]
#
# Options:
#   --skip-migrations   Skip database migration step
#   --skip-functions    Skip edge function deployment
#   --dry-run          Show what would be done without executing
#
# Requirements: 12.3, 12.4
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_MIGRATIONS=false
SKIP_FUNCTIONS=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    --skip-functions)
      SKIP_FUNCTIONS=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${GREEN}========================================${NC}"
}

confirm() {
  if [ "$DRY_RUN" = true ]; then
    return 0
  fi
  
  read -p "$1 (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Deployment cancelled by user"
    exit 1
  fi
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is not installed. Please install it first."
    exit 1
  fi
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

log_step "Step 0: Pre-flight Checks"

# Check required commands
log_info "Checking required commands..."
check_command "supabase"
check_command "curl"
log_success "All required commands are available"

# Check if Supabase is linked
log_info "Checking Supabase project link..."
if ! supabase projects list &> /dev/null; then
  log_error "Not logged in to Supabase. Run: supabase login"
  exit 1
fi

# Get linked project
PROJECT_REF=$(supabase status 2>/dev/null | grep "Project ref:" | awk '{print $3}')
if [ -z "$PROJECT_REF" ]; then
  log_error "No Supabase project linked. Run: supabase link --project-ref YOUR_PROJECT_REF"
  exit 1
fi

log_success "Linked to Supabase project: $PROJECT_REF"

# Check environment variables
log_info "Checking environment variables..."
if [ ! -f ".env" ]; then
  log_warning ".env file not found. Make sure environment variables are set."
fi

# Confirm deployment
echo ""
log_warning "You are about to deploy the Email Management System to PRODUCTION"
log_warning "Project: $PROJECT_REF"
echo ""
confirm "Are you sure you want to continue?"

# ============================================================================
# Step 1: Database Migrations
# ============================================================================

if [ "$SKIP_MIGRATIONS" = false ]; then
  log_step "Step 1: Database Migrations"
  
  log_info "Checking migration status..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would check: supabase db remote list"
  else
    supabase db remote list
  fi
  
  echo ""
  confirm "Apply all pending migrations to production?"
  
  log_info "Applying migrations..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would run: supabase db push"
  else
    supabase db push
  fi
  
  log_success "Database migrations applied successfully"
  
  # Verify email tables were created
  log_info "Verifying email tables..."
  if [ "$DRY_RUN" = false ]; then
    TABLES=$(supabase db remote exec "
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'email_%';
    " | grep -oP '\d+' | head -1)
    
    if [ "$TABLES" -ge 9 ]; then
      log_success "Email tables verified ($TABLES tables found)"
    else
      log_error "Email tables not found or incomplete ($TABLES tables found, expected 9)"
      exit 1
    fi
  fi
else
  log_warning "Skipping database migrations (--skip-migrations flag)"
fi

# ============================================================================
# Step 2: Deploy Edge Functions
# ============================================================================

if [ "$SKIP_FUNCTIONS" = false ]; then
  log_step "Step 2: Deploy Edge Functions"
  
  log_info "Deploying process-email-queue edge function..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would run: supabase functions deploy process-email-queue"
  else
    supabase functions deploy process-email-queue
  fi
  
  log_success "Edge function deployed successfully"
  
  # List deployed functions
  log_info "Verifying deployed functions..."
  if [ "$DRY_RUN" = false ]; then
    supabase functions list
  fi
else
  log_warning "Skipping edge function deployment (--skip-functions flag)"
fi

# ============================================================================
# Step 3: Configuration Instructions
# ============================================================================

log_step "Step 3: Manual Configuration Required"

echo ""
log_warning "The following steps must be completed manually:"
echo ""

echo "1. Configure Cron Trigger for Email Queue Processing:"
echo "   - Go to Supabase Dashboard → Edge Functions → process-email-queue"
echo "   - Click Settings → Cron"
echo "   - Set schedule: * * * * * (every minute)"
echo "   - Save"
echo ""

echo "2. Configure Email Provider in Admin UI:"
echo "   - Go to: https://your-domain.com/admin/emails/providers"
echo "   - Select provider (Resend or AWS SES)"
echo "   - Enter production API credentials"
echo "   - Test connection"
echo ""

echo "3. Add and Verify Sender Address:"
echo "   - Go to: https://your-domain.com/admin/emails/senders"
echo "   - Add sender email address"
echo "   - Follow DNS verification instructions"
echo "   - Add DKIM, SPF, and DMARC records"
echo ""

echo "4. Configure Webhooks:"
echo ""
echo "   For Resend:"
echo "   - Go to: https://resend.com/webhooks"
echo "   - Add webhook URL: https://your-domain.com/api/webhooks/email/resend"
echo "   - Select events: sent, delivered, bounced, complained, opened, clicked"
echo ""
echo "   For AWS SES:"
echo "   - Create SNS topic: aws sns create-topic --name email-events-production"
echo "   - Configure SES event destination"
echo "   - Subscribe webhook endpoint to SNS topic"
echo ""

echo "5. Set Up Monitoring and Alerting:"
echo "   - Configure alerts for queue depth > 500"
echo "   - Configure alerts for failure rate > 10%"
echo "   - Configure alerts for bounce rate > 10%"
echo "   - Set up error tracking (Sentry, Datadog, etc.)"
echo ""

# ============================================================================
# Step 4: Testing Instructions
# ============================================================================

log_step "Step 4: Testing Instructions"

echo ""
log_info "After completing manual configuration, test the system:"
echo ""

echo "1. Send a test email:"
echo "   curl -X POST https://your-domain.com/api/emails/send \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \\"
echo "     -d '{"
echo "       \"templateId\": \"purchase-confirmation\","
echo "       \"to\": \"your-test-email@example.com\","
echo "       \"variables\": {"
echo "         \"buyerName\": \"Test User\","
echo "         \"galleryName\": \"Test Gallery\","
echo "         \"photoCount\": 5,"
echo "         \"amountPaid\": \"\$50.00\","
echo "         \"transactionId\": \"test_123\","
echo "         \"purchaseDate\": \"2026-02-06\","
echo "         \"accessLink\": \"https://your-domain.com/gallery/test\","
echo "         \"photographerName\": \"Test Photographer\""
echo "       }"
echo "     }'"
echo ""

echo "2. Verify email delivery:"
echo "   - Check that email was received"
echo "   - Verify email content renders correctly"
echo "   - Check email logs: https://your-domain.com/admin/emails/logs"
echo "   - Verify webhook events are being received"
echo ""

echo "3. Monitor queue processing:"
echo "   - Check edge function logs: supabase functions logs process-email-queue --tail"
echo "   - Monitor queue depth in admin UI"
echo "   - Verify emails are processed within 1-2 minutes"
echo ""

# ============================================================================
# Step 5: Monitoring Queries
# ============================================================================

log_step "Step 5: Monitoring Queries"

echo ""
log_info "Use these SQL queries to monitor the email system:"
echo ""

echo "-- Queue depth"
echo "SELECT status, COUNT(*) as count"
echo "FROM email_queue"
echo "GROUP BY status;"
echo ""

echo "-- Recent failures (last hour)"
echo "SELECT COUNT(*) as failed_count"
echo "FROM email_queue"
echo "WHERE status = 'failed'"
echo "AND updated_at > NOW() - INTERVAL '1 hour';"
echo ""

echo "-- Delivery rate (last 24 hours)"
echo "SELECT "
echo "  COUNT(*) FILTER (WHERE status = 'sent') as sent,"
echo "  COUNT(*) FILTER (WHERE status = 'failed') as failed,"
echo "  ROUND("
echo "    COUNT(*) FILTER (WHERE status = 'sent')::numeric / "
echo "    NULLIF(COUNT(*), 0) * 100, "
echo "    2"
echo "  ) as delivery_rate_percent"
echo "FROM email_queue"
echo "WHERE created_at > NOW() - INTERVAL '24 hours';"
echo ""

# ============================================================================
# Completion
# ============================================================================

log_step "Deployment Complete"

echo ""
log_success "Email Management System deployment script completed!"
echo ""
log_warning "Next steps:"
echo "  1. Complete manual configuration steps above"
echo "  2. Test email sending with test emails"
echo "  3. Monitor for 24-48 hours"
echo "  4. Set up alerting for critical failures"
echo ""
log_info "For detailed instructions, see:"
echo "  docs/deployment/email-system-production-deployment.md"
echo ""
