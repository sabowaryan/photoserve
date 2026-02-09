/**
 * useUpgradeTriggers Hook
 * React hook for detecting and managing upgrade triggers
 * 
 * @module hooks/use-upgrade-triggers
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './use-subscription';
import { 
  detectUpgradeTrigger, 
  getClickedLockedFeatures,
  trackLockedFeatureClick as trackFeature,
  type TriggerCondition,
  type UserBehavior 
} from '@/lib/conversion/upgrade-triggers';
import { createClient } from '@/lib/supabase/client';
import { createAnalyticsService } from '@/lib/services/analytics.service';

export function useUpgradeTriggers() {
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [trigger, setTrigger] = useState<TriggerCondition | null>(null);
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user behavior data
  useEffect(() => {
    async function fetchBehavior() {
      if (subscriptionLoading) return;
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch user's galleries count
        const { data: galleries } = await supabase
          .from('galleries')
          .select('id, created_at')
          .eq('user_id', user.id);

        // Fetch user's storage usage
        const { data: profile } = await supabase
          .from('profiles')
          .select('storage_used_mb, created_at')
          .eq('id', user.id)
          .single();

        // Fetch last upgrade prompt from logs
        const { data: lastPrompt } = await supabase
          .from('upgrade_trigger_logs')
          .select('shown_at')
          .eq('user_id', user.id)
          .eq('shown', true)
          .order('shown_at', { ascending: false })
          .limit(1)
          .single();

        // Calculate days active
        const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
        const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Get clicked locked features from localStorage
        const clickedLockedFeatures = getClickedLockedFeatures();

        // Fetch total views (mock for now - would come from analytics)
        const totalViews = 0; // TODO: Implement analytics query

        const userBehavior: UserBehavior = {
          galleriesCreated: galleries?.length || 0,
          daysActive,
          lastUpgradePrompt: lastPrompt?.shown_at ? new Date(lastPrompt.shown_at) : undefined,
          clickedLockedFeatures,
          currentStorageMb: profile?.storage_used_mb || 0,
          totalViews,
        };

        setBehavior(userBehavior);
      } catch (error) {
        console.error('Error fetching user behavior:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBehavior();
  }, [subscriptionLoading]);

  // Detect trigger when behavior or subscription changes
  useEffect(() => {
    if (!behavior || !subscription || isLoading) return;

    const detectedTrigger = detectUpgradeTrigger(subscription, behavior);
    setTrigger(detectedTrigger);
  }, [behavior, subscription, isLoading]);

  // Track locked feature click
  const trackLockedFeatureClick = useCallback((featureName: string) => {
    trackFeature(featureName);
    
    // Update behavior to trigger re-detection
    if (behavior) {
      setBehavior({
        ...behavior,
        clickedLockedFeatures: [...behavior.clickedLockedFeatures, featureName],
      });
    }
  }, [behavior]);

  // Log trigger shown
  const logTriggerShown = useCallback(async (triggerCondition: TriggerCondition) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Requirement 8.8: Log to database
      await supabase.from('upgrade_trigger_logs').insert({
        user_id: user.id,
        trigger_type: triggerCondition.type,
        shown: true,
        shown_at: new Date().toISOString(),
      });

      // Requirement 8.8: Track with analytics service
      const analytics = createAnalyticsService(supabase);
      await analytics.trackFunnelEvent('upgrade_modal_shown', {
        trigger_type: triggerCondition.type,
        priority: triggerCondition.priority,
        feature_type: triggerCondition.featureType,
        limit_type: triggerCondition.limitType,
      });

      // Update behavior to prevent immediate re-trigger
      if (behavior) {
        setBehavior({
          ...behavior,
          lastUpgradePrompt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error logging trigger shown:', error);
    }
  }, [behavior]);

  // Log trigger dismissed
  const logTriggerDismissed = useCallback(async (triggerCondition: TriggerCondition) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Update the most recent log entry
      const { data: lastLog } = await supabase
        .from('upgrade_trigger_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('trigger_type', triggerCondition.type)
        .order('shown_at', { ascending: false })
        .limit(1)
        .single();

      if (lastLog) {
        await supabase
          .from('upgrade_trigger_logs')
          .update({
            dismissed: true,
            dismissed_at: new Date().toISOString(),
          })
          .eq('id', lastLog.id);
      }

      // Track with analytics
      const analytics = createAnalyticsService(supabase);
      await analytics.trackFunnelEvent('upgrade_modal_dismissed', {
        trigger_type: triggerCondition.type,
      });
    } catch (error) {
      console.error('Error logging trigger dismissed:', error);
    }
  }, []);

  // Log trigger converted
  const logTriggerConverted = useCallback(async (triggerCondition: TriggerCondition, planSelected: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Update the most recent log entry
      const { data: lastLog } = await supabase
        .from('upgrade_trigger_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('trigger_type', triggerCondition.type)
        .order('shown_at', { ascending: false })
        .limit(1)
        .single();

      if (lastLog) {
        await supabase
          .from('upgrade_trigger_logs')
          .update({
            converted: true,
            converted_at: new Date().toISOString(),
            plan_selected: planSelected,
          })
          .eq('id', lastLog.id);
      }

      // Track with analytics
      const analytics = createAnalyticsService(supabase);
      await analytics.trackFunnelEvent('upgrade_completed', {
        trigger_type: triggerCondition.type,
        plan_selected: planSelected,
      });
    } catch (error) {
      console.error('Error logging trigger converted:', error);
    }
  }, []);

  return {
    trigger,
    isLoading: isLoading || subscriptionLoading,
    trackLockedFeatureClick,
    logTriggerShown,
    logTriggerDismissed,
    logTriggerConverted,
  };
}
