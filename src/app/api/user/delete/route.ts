/**
 * User Account Deletion API Route
 * RGPD right to erasure
 * 
 * @module api/user/delete
 * Requirement: 23.6 - Allow users to delete their account and all data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function DELETE(_request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Get user profile for Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    // Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        // Continue with deletion even if Stripe fails
      }
    }

    // Delete Stripe customer if exists
    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id);
      } catch (error) {
        console.error('Error deleting Stripe customer:', error);
        // Continue with deletion even if Stripe fails
      }
    }

    // Delete user data in order (respecting foreign key constraints)
    
    // 1. Delete gallery analytics (linked via galleries)
    // First get all gallery IDs for this user
    const { data: userGalleries } = await supabase
      .from('galleries')
      .select('id')
      .eq('user_id', userId);

    if (userGalleries && userGalleries.length > 0) {
      const galleryIds = userGalleries.map(g => g.id);
      const { error: analyticsError } = await supabase
        .from('gallery_analytics')
        .delete()
        .in('gallery_id', galleryIds);

      if (analyticsError) {
        console.error('Error deleting gallery analytics:', analyticsError);
      }
    }
    
    // 2. Delete images (has foreign keys to galleries)
    const { error: imagesError } = await supabase
      .from('images')
      .delete()
      .eq('user_id', userId);

    if (imagesError) {
      console.error('Error deleting images:', imagesError);
    }

    // 3. Delete galleries
    const { error: galleriesError } = await supabase
      .from('galleries')
      .delete()
      .eq('user_id', userId);

    if (galleriesError) {
      console.error('Error deleting galleries:', galleriesError);
    }

    // 4. Delete upgrade trigger logs
    const { error: upgradeLogsError } = await supabase
      .from('upgrade_trigger_logs')
      .delete()
      .eq('user_id', userId);

    if (upgradeLogsError) {
      console.error('Error deleting upgrade logs:', upgradeLogsError);
    }

    // 5. Delete onboarding state
    const { error: onboardingError } = await supabase
      .from('onboarding_states')
      .delete()
      .eq('user_id', userId);

    if (onboardingError) {
      console.error('Error deleting onboarding state:', onboardingError);
    }

    // 6. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 7. Delete auth user (this will cascade delete related data)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account and all data successfully deleted',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
