import { redirect } from "next/navigation";
import { getSession, requireSupabaseClient } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

async function getProfile(userId: string) {
  const { supabase } = await requireSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, subscription_plan")
    .eq("id", userId)
    .maybeSingle();

  return profile;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const profile = await getProfile(session.user.id);
  const userName = profile?.name || session.user.email?.split("@")[0] || "";
  const userPlan = profile?.subscription_plan || "free";

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={userName} userPlan={userPlan} />
      {children}
    </div>
  );
}
