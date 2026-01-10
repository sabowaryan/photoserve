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
  Menu,
  X,
} from "lucide-react";

/**
 * Navigation items for the admin sidebar
 */
const navItems = [
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
    href: "/admin/audit-logs",
    label: "Journal d'audit",
    icon: FileText,
  },
];

/**
 * Admin Navigation Component
 * 
 * Responsive sidebar navigation for the admin dashboard with:
 * - Links to Dashboard, Users, Galleries, Analytics, Subscriptions, Audit Logs
 * - Active state highlighting based on current route
 * - Mobile hamburger menu
 * 
 * Requirements: 1.3
 */
export function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavContent = () => (
    <>
      <nav className="p-4 space-y-1">
        <div className="px-3 py-2 mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Administration
          </h2>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-indigo-600" : "text-slate-400"}`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer with back to dashboard link */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
        <Link
          href="/dashboard"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
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
          Retour au dashboard
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-24 left-4 z-50 p-2 bg-white rounded-xl border border-slate-200 shadow-lg hover:bg-slate-50 transition-colors"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-600" />
        ) : (
          <Menu className="w-6 h-6 text-slate-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-20 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
