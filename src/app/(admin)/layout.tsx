import { redirect } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavWrapper } from "@/components/admin/admin-nav-wrapper";
import { AdminSessionMarker } from "@/components/admin/admin-session-marker";

/**
 * Check if the current user has admin privileges
 * Requirements: 1.1, 1.2
 */
async function checkAdminAccess(userId: string): Promise<{ isAdmin: boolean; name: string | null }> {
  const { supabase } = await requireSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_admin")
    .eq("id", userId)
    .maybeSingle();

  return {
    isAdmin: profile?.is_admin === true,
    name: profile?.name ?? null,
  };
}

/**
 * Admin Layout Component
 * 
 * Server-side layout that:
 * - Verifies user authentication
 * - Checks admin role and redirects to 403 if not admin
 * - Renders admin-specific header and navigation
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect to auth if not authenticated
  if (!session?.user) {
    redirect("/auth");
  }

  const { isAdmin, name } = await checkAdminAccess(session.user.id);

  // Redirect to 403 if not admin (Requirement 1.2)
  if (!isAdmin) {
    redirect("/403");
  }

  const adminName = name || session.user.email?.split("@")[0] || "Admin";
  const adminEmail = session.user.email || "";

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <AdminSessionMarker />
      <AdminHeader adminName={adminName} adminEmail={adminEmail} />
      <div className="flex pt-16">
        <AdminNavWrapper />
        <main className="flex-1 min-w-0 lg:ml-56 p-3 sm:p-4 lg:p-6">
          <div className="max-w-full overflow-x-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
