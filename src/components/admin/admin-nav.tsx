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
  Menu,
  X,
  Mail,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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
  badge?: boolean; // Whether to show a notification badge
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
    label: "Utilisateurs",
    icon: Users,
  },
  {
    href: "/admin/galleries",
    label: "Galeries",
    icon: Image,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/subscriptions",
    label: "Abonnements",
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
    label: "Journal d'audit",
    icon: FileText,
  },
  {
    href: "/admin/settings",
    label: "Paramètres",
    icon: Settings,
  },
];

/**
 * Admin Navigation Component
 * 
 * Responsive sidebar navigation for the admin dashboard with:
 * - Links to Dashboard, Users, Galleries, Analytics, Subscriptions, Audit Logs
 * - Active state highlighting based on current route
 * - Mobile hamburger menu
 * - Sub-menu support for Emails section
 * - Notification badge for failed emails
 * 
 * Requirements: 1.3, 9.5
 */
export function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [failedEmailCount, setFailedEmailCount] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
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
    // Refresh every 30 seconds
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /**
   * Check if a nav item is active based on current pathname
   */
  const isActive = (href: string, exact?: boolean) => {
    // Always use pathname for consistent SSR/client rendering
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /**
   * Toggle expansion of a nav item with sub-items
   */
  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  /**
   * Get badge count for a nav item
   */
  const getBadgeCount = (item: NavItem): number | null => {
    // Always return null during SSR to prevent hydration mismatch
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
      <div className="flex flex-col h-full">
        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto pb-20">
          <nav className="p-3 space-y-0.5">
            <div className="px-2.5 py-1.5 mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Administration
              </h2>
            </div>

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
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                        active
                          ? "bg-indigo-50 text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`}
                        strokeWidth={2}
                      />
                      <span className="flex-1">{item.label}</span>
                      
                      {/* Badge for notifications - only render after mount to prevent hydration mismatch */}
                      {isMounted && item.badge && badgeCount !== null && (
                        <span 
                          className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                      
                      {/* Expand/collapse icon for items with sub-items */}
                      {hasSubItems && (
                        <>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                          )}
                        </>
                      )}
                    </Link>
                  </div>

                  {/* Sub-menu items */}
                  {hasSubItems && isExpanded && (
                    <div className="mt-1 space-y-0.5 pl-8">
                      {item.subItems!.map((subItem) => {
                        const subActive = isActive(subItem.href, subItem.href === item.href);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              subActive
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${subActive ? "bg-indigo-600" : "bg-slate-300"}`}></span>
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
        <div className="flex-shrink-0 p-3 border-t border-slate-200 bg-white">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour à mon espace
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-3 z-50 p-1.5 bg-white rounded-lg border border-slate-200 shadow-md hover:bg-slate-50 transition-colors"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-slate-600" />
        ) : (
          <Menu className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-slate-200">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
