"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavWrapper } from "@/components/admin/admin-nav-wrapper";
import { AdminLayoutProvider } from "@/components/admin/admin-layout-context";

interface AdminLayoutClientProps {
  adminName: string;
  adminEmail: string;
  adminAvatar: string | null;
  children: ReactNode;
}

/**
 * Get page title based on pathname
 */
function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/users": "Users Management",
    "/admin/galleries": "Galleries",
    "/admin/analytics": "Analytics",
    "/admin/subscriptions": "Subscriptions",
    "/admin/emails": "Email System",
    "/admin/emails/providers": "Email Providers",
    "/admin/emails/senders": "Email Senders",
    "/admin/emails/templates": "Email Templates",
    "/admin/emails/logs": "Email Logs",
    "/admin/emails/analytics": "Email Analytics",
    "/admin/emails/suppressions": "Email Suppressions",
    "/admin/emails/monitoring": "Email Monitoring",
    "/admin/audit-logs": "Audit Logs",
    "/admin/settings": "Settings",
    "/admin/plugin": "Plugin Management",
  };

  return routes[pathname] || "Admin Dashboard";
}

export function AdminLayoutClient({
  adminName,
  adminEmail,
  adminAvatar,
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <AdminLayoutProvider>
      <div className="h-screen w-full overflow-hidden flex">
        <AdminNavWrapper />
        <div className="flex-1 flex flex-col h-full overflow-hidden lg:ml-56">
          <AdminHeader 
            adminName={adminName} 
            adminEmail={adminEmail} 
            adminAvatar={adminAvatar}
            pageTitle={pageTitle}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminLayoutProvider>
  );
}
