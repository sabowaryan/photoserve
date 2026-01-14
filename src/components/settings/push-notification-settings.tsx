'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Bell, BellOff } from 'lucide-react';

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);

    try {
      if (enabled) {
        const newSubscription = await subscribe();
        
        if (newSubscription) {
          // Save subscription to backend
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSubscription),
          });

          if (!response.ok) {
            throw new Error('Failed to save subscription');
          }
        }
      } else {
        await unsubscribe();
        
        if (subscription) {
          // Remove subscription from backend
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Notifications Push</h3>
            <p className="text-sm text-muted-foreground">
              Les notifications push ne sont pas supportées par votre navigateur.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Notifications Push</h3>
            <p className="text-sm text-muted-foreground">
              Recevez des notifications pour les nouveaux commentaires et favoris sur vos galeries.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="text-sm">
              Activer les notifications
            </Label>
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || isSaving}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {isSubscribed && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Vous recevrez des notifications pour :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Nouveaux commentaires sur vos photos</li>
                <li>Photos marquées comme favorites</li>
                <li>Galeries bientôt expirées</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
