"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Image,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  X,
  Mail,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/shared/logo";
import { useAdminLayout } from "./admin-layout-context";

/**
 * Navigation item type with optional sub-menu support
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  subItems?: {
    href: string;
    label: string;
  }[];
  badge?: boolean;
}

/**
 * Navigation items for the admin sidebar
 */
const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/galleries",
    label: "Galleries",
    icon: Image,
  },
  {
    href: "/admin/plugin",
    label: "Plugin",
    icon: Package,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
  },
  {
    href: "/admin/emails",
    label: "Emails",
    icon: Mail,
    badge: true,
    subItems: [
      {
        href: "/admin/emails",
        label: "Dashboard",
      },
      {
        href: "/admin/emails/providers",
        label: "Providers",
      },
      {
        href: "/admin/emails/senders",
        label: "Senders",
      },
      {
        href: "/admin/emails/templates",
        label: "Templates",
      },
      {
        href: "/admin/emails/logs",
        label: "Logs",
      },
      {
        href: "/admin/emails/analytics",
        label: "Analytics",
      },
      {
        href: "/admin/emails/suppressions",
        label: "Suppressions",
      },
    ],
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: FileText,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

/**
 * Admin Navigation Component
 * 
 * Modern, clean sidebar navigation for the admin dashboard with:
 * - Smooth animations and transitions
 * - Active state highlighting with gradient accent
 * - Collapsible sub-menus
 * - Real-time notification badges
 * - Mobile-responsive with slide-out menu
 * 
 * Requirements: 1.3, 9.5
 */
export function AdminNav() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useAdminLayout();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [failedEmailCount, setFailedEmailCount] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch failed email count
  useEffect(() => {
    if (!isMounted) return;

    const fetchFailedCount = async () => {
      try {
        const response = await fetch("/api/emails/queue/status");
        if (response.ok) {
          const data = await response.json();
          setFailedEmailCount(data.status?.failed || 0);
        }
      } catch (error) {
        console.error("Failed to fetch failed email count:", error);
      }
    };

    fetchFailedCount();
    const interval = setInterval(fetchFailedCount, 30000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Auto-expand parent items when on a sub-page
  useEffect(() => {
    const expanded: string[] = [];
    navItems.forEach((item) => {
      if (item.subItems) {
        const isSubItemActive = item.subItems.some(
          (subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
        );
        if (isSubItemActive) {
          expanded.push(item.href);
        }
      }
    });
    setExpandedItems(expanded);
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, setIsMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [setIsMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const getBadgeCount = (item: NavItem): number | null => {
    if (typeof window === 'undefined' || !isMounted) {
      return null;
    }
    
    if (item.badge && item.href === "/admin/emails" && failedEmailCount !== null) {
      return failedEmailCount > 0 ? failedEmailCount : null;
    }
    return null;
  };

  const NavContent = () => {
    return (
      <div className="flex flex-col h-full py-8">
        {/* Logo Section */}
        <div className="flex items-center justify-between px-8 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-piksend-gradient flex items-center justify-center">
              <LogoIcon size={18} variant="white" />
            </div>
            <span className="text-xl font-bold text-slate-800" dir="ltr">
              PikSend
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="space-y-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const isExpanded = expandedItems.includes(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const badgeCount = getBadgeCount(item);

              return (
                <div key={item.href}>
                  {/* Main nav item */}
                  <div className="relative">
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasSubItems) {
                          e.preventDefault();
                          toggleExpanded(item.href);
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-4 px-6 py-3 font-medium text-sm transition-all cursor-pointer relative",
                        active
                          ? "text-primary"
                          : "text-slate-500 hover:text-primary/70"
                      )}
                    >
                      {active && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                      <div className={cn(active ? "text-primary" : "text-slate-400")}>
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      
                      {/* Badge */}
                      {isMounted && item.badge && badgeCount !== null && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                      
                      {/* Expand/collapse icon */}
                      {hasSubItems && (
                        <>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={2} />
                          )}
                        </>
                      )}
                    </Link>
                  </div>

                  {/* Sub-menu items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-9 pl-3 border-l-2 border-slate-200 animate-in slide-in-from-top-2 duration-200">
                      {item.subItems!.map((subItem) => {
                        const subActive = isActive(subItem.href, subItem.href === item.href);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all cursor-pointer",
                              subActive
                                ? "text-primary"
                                : "text-slate-500 hover:text-primary/70"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all",
                              subActive ? "bg-primary" : "bg-slate-300"
                            )} />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Fixed footer */}
        <div className="px-6 mt-auto">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Return to</span>
                <span className="text-xs font-semibold text-slate-800 line-clamp-1">Dashboard</span>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-slate-50 z-30">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-50 z-[70] transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
