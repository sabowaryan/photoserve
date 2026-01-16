'use client';

import { useState } from 'react';
import { Bell, BellOff, CheckCircle2, Smartphone, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';

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

  const [localError, setLocalError] = useState<string | null>(null);

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    setLocalError(null);

    try {
      if (enabled) {
        const newSubscription = await subscribe();
        
        if (!newSubscription) {
          setIsSaving(false);
          return;
        }

        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Échec de l\'enregistrement');
        }
      } else {
        const currentEndpoint = subscription?.endpoint;
        await unsubscribe();
        
        if (currentEndpoint) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: currentEndpoint }),
          });
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Une erreur est survenue');
      if (enabled) {
        await unsubscribe();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      icon: MessageSquare,
      title: 'Nouveaux commentaires',
      description: 'Quand quelqu\'un commente vos photos',
    },
    {
      icon: CheckCircle2,
      title: 'Photos favorites',
      description: 'Quand vos photos sont marquées comme favorites',
    },
    {
      icon: Clock,
      title: 'Galeries expirantes',
      description: 'Rappels avant l\'expiration de vos galeries',
    },
  ];

  if (!isSupported) {
    return (
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
            <BellOff size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Notifications Push</h2>
            <p className="text-xs text-slate-500">Restez informé en temps réel</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <BellOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Non supporté</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Les notifications push ne sont pas supportées par votre navigateur.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isSubscribed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
        )}>
          <Bell size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Notifications Push</h2>
          <p className="text-xs text-slate-500">Restez informé en temps réel</p>
        </div>
        {isSubscribed && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} />
            Activées
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Toggle principal */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border transition-colors",
          isSubscribed 
            ? "bg-green-50/50 border-green-200" 
            : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSubscribed ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"
            )}>
              <Smartphone size={18} />
            </div>
            <div>
              <Label htmlFor="push-notifications" className="text-sm font-medium text-slate-900 cursor-pointer">
                Activer les notifications
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Recevez des alertes sur cet appareil
              </p>
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || isSaving}
          />
        </div>

        {(error || localError) && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <BellOff size={16} />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Types de notifications */}
        {isSubscribed && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              Vous recevrez des notifications pour :
            </Label>
            <div className="grid gap-3">
              {notificationTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                    <type.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{type.title}</p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {(isLoading || isSaving) && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isSaving ? 'Mise à jour...' : 'Chargement...'}</span>
          </div>
        )}
      </div>
    </section>
  );
}
