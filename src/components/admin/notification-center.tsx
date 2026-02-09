"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "warning":
        return <AlertTriangle className="text-amber-500" size={18} />;
      case "error":
        return <AlertCircle className="text-rose-500" size={18} />;
      default:
        return <Info className="text-primary" size={18} />;
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 lg:p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all relative",
          isOpen && "bg-primary/10 text-primary"
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Updates & alerts
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                title="Mark all as read"
              >
                <CheckCheck size={16} />
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => onMarkAsRead(notif.id)}
                    className={cn(
                      "p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative",
                      !notif.isRead && "bg-primary/5"
                    )}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                    )}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-white shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4
                            className={cn(
                              "text-xs font-bold",
                              notif.isRead ? "text-slate-700" : "text-slate-900"
                            )}
                          >
                            {notif.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="text-slate-300" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">No new alerts</p>
                <p className="text-xs text-slate-400 mt-1">
                  Check back later for updates
                </p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <button className="w-full py-3 bg-slate-50 text-[11px] font-bold text-slate-500 hover:text-primary hover:bg-white transition-all border-t border-slate-100">
              VIEW ALL ACTIVITY
            </button>
          )}
        </div>
      )}
    </div>
  );
}
