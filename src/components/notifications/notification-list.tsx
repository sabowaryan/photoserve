"use client";

import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck,
  Check,
  CheckCheck,
  X
} from "lucide-react";
import Link from "next/link";
import type { InAppNotification, NotificationType } from "@/lib/services/in-app-notification.service";

interface NotificationListProps {
  notifications: InAppNotification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  sale: <DollarSign size={16} className="text-green-600" />,
  payout: <CreditCard size={16} className="text-blue-600" />,
  dispute: <AlertTriangle size={16} className="text-red-600" />,
  refund: <RefreshCw size={16} className="text-orange-600" />,
  account_update: <UserCheck size={16} className="text-purple-600" />,
};

const notificationBgColors: Record<NotificationType, string> = {
  sale: 'bg-green-50',
  payout: 'bg-blue-50',
  dispute: 'bg-red-50',
  refund: 'bg-orange-50',
  account_update: 'bg-purple-50',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getNotificationLink(notification: InAppNotification): string | null {
  switch (notification.type) {
    case 'sale':
    case 'refund':
      return '/revenue';
    case 'payout':
      return '/revenue?tab=payouts';
    case 'dispute':
      return '/revenue/disputes';
    case 'account_update':
      return '/settings';
    default:
      return null;
  }
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) {
  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              title="Tout marquer comme lu"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Tout lire</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Aucune notification</p>
            <p className="text-xs text-slate-400 mt-1">
              Vous serez notifié des nouvelles ventes, virements et alertes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={`flex gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-indigo-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      onMarkAsRead(notification.id);
                    }
                    if (link) {
                      onClose();
                    }
                  }}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${notificationBgColors[notification.type]} flex items-center justify-center`}>
                    {notificationIcons[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Mark as read button (for unread) */}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );

              return link ? (
                <Link key={notification.id} href={link}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-100 p-2">
          <Link
            href="/revenue"
            onClick={onClose}
            className="block w-full py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Voir tout
          </Link>
        </div>
      )}
    </div>
  );
}

// Import Bell for empty state
import { Bell } from "lucide-react";
