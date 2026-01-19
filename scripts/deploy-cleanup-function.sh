#!/bin/bash

# Deploy the updated cleanup-expired-galleries function to Supabase

echo "🚀 Deploying cleanup-expired-galleries function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Deploy the function
supabase functions deploy cleanup-expired-galleries

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "Test the function with:"
    echo "curl -X POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries"
else
    echo "❌ Deployment failed"
    exit 1
fi
