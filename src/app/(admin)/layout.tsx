import { redirect } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { AdminSessionMarker } from "@/components/admin/admin-session-marker";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

async function getProfile(userId: string) {
  const { supabase } = await requireSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_admin, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return profile;
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

  const profile = await getProfile(session.user.id);

  // Redirect to 403 if not admin (Requirement 1.2)
  if (!profile?.is_admin) {
    redirect("/403");
  }

  const adminName = profile.name || session.user.email?.split("@")[0] || "Admin";
  const adminEmail = session.user.email || "";
  const adminAvatar = profile.avatar_url || session.user.image || null;

  return (
    <div className="h-screen bg-[#f8fafc] overflow-hidden flex">
      <AdminSessionMarker />
      <AdminLayoutClient
        adminName={adminName}
        adminEmail={adminEmail}
        adminAvatar={adminAvatar}
      >
        {children}
      </AdminLayoutClient>
    </div>
  );
}
