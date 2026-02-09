"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, User, Menu, Search, X, Settings, Shield, CreditCard, HelpCircle, ChevronDown } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { clearSessionCache } from "@/hooks/use-cached-session";
import { useAdminLayout } from "./admin-layout-context";
import { NotificationCenter, type Notification } from "./notification-center";
import { SettingsModal } from "./settings-modal";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "New User Registration",
    message: "A new user has registered and is awaiting verification.",
    time: "2 mins ago",
    type: "success",
    isRead: false,
  },
  {
    id: "n2",
    title: "System Alert",
    message: "Email queue processing is experiencing delays. Check the email dashboard.",
    time: "1 hour ago",
    type: "warning",
    isRead: false,
  },
  {
    id: "n3",
    title: "Analytics Report Ready",
    message: "Your weekly analytics report has been generated and is ready to view.",
    time: "3 hours ago",
    type: "info",
    isRead: true,
  },
];

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
  adminAvatar?: string | null;
  pageTitle?: string;
}

/**
 * Admin Header Component
 * 
 * Modern, clean header for the admin dashboard with:
 * - Minimalist logo and branding
 * - User dropdown menu with avatar
 * - Language switcher
 * - Sign out functionality
 * 
 * Requirements: 1.3
 */
export function AdminHeader({ adminName, adminAvatar, pageTitle = "Admin Dashboard" }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const { toggleMobileMenu } = useAdminLayout();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      // Logout Supabase session
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear session cache
      clearSessionCache();

      // Logout NextAuth (removes cookies)
      await signOut({ redirect: false });

      // Force full refresh to clear all caches
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoggingOut(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dropdownItems = [
    { icon: User, label: "My Profile", description: "Account settings & more", href: "/admin/settings" },
    { icon: Shield, label: "Audit Logs", description: "Security & activity logs", href: "/admin/audit-logs" },
    { icon: CreditCard, label: "Subscriptions", description: "Plans & billing", href: "/admin/subscriptions" },
    { icon: HelpCircle, label: "Analytics", description: "Reports & insights", href: "/admin/analytics" },
  ];

  const handleDropdownItemClick = () => {
    setUserDropdownOpen(false);
    // Navigation will be handled by Link component
  };

  return (
    <header className="sticky top-0 left-0 right-0 h-16 lg:h-20 z-40 shrink-0">
      <div className="h-full bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10">
        <div className="h-full max-w-[1600px] mx-auto w-full flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Page Title */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div>
              <h1 className="text-base lg:text-xl font-bold text-slate-900">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-6">
            {/* Search Bar - Desktop Only */}
            <div className="relative group w-48 xl:w-80 hidden md:block">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  searchQuery ? "text-primary" : "text-slate-300"
                }`}
                size={16}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin panel... (press /)"
                className="w-full pl-11 pr-10 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-xs lg:text-sm transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 lg:gap-3">
              {/* Notification Center */}
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearNotifications}
              />

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={cn(
                  "p-2 lg:p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all",
                  isSettingsOpen && "bg-primary/10 text-primary"
                )}
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>

              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher variant="compact" />
              </div>

              <div className="w-px h-6 bg-slate-100 mx-1 lg:mx-2 hidden sm:block" />

              {/* User Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center gap-2 lg:gap-3 pl-1 lg:pl-2 py-1.5 rounded-2xl transition-all hover:bg-slate-50 ${
                    isUserDropdownOpen ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="text-right hidden xl:block">
                    <p className="text-sm font-bold text-slate-800">{adminName}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                      Administrator
                    </p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 shrink-0">
                    <UserAvatar 
                      name={adminName} 
                      src={adminAvatar} 
                      size="md"
                      variant="rounded" 
                    />
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 hidden sm:block ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-[24px] shadow-2xl shadow-slate-200 border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-3 mb-2 border-b border-slate-50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Account
                      </p>
                    </div>

                    <div className="space-y-1">
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={handleDropdownItemClick}
                          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <item.icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.label}</p>
                            <p className="text-[10px] text-slate-400">{item.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-rose-50 transition-colors group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                          {isLoggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                            {isLoggingOut ? "Signing out..." : "Sign Out"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            End your session securely
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
