import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { generatePageMetadata } from "@/lib/services";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = generatePageMetadata("dashboard");

/**
 * Dashboard Page - Server Component
 * 
 * This page uses streaming with loading.tsx for instant FCP.
 * Data fetching is delegated to the client component using SWR
 * to avoid blocking the initial render.
 * 
 * Requirements: 2.1 - Server components SHALL NOT make blocking database queries
 */
export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  // Extract user info for the client component
  const userEmail = session.user.email || "";

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-6 pt-28 pb-16">
        {/* Background Glow Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Pass only userEmail to client component - data fetching happens client-side */}
        <DashboardClient
          userEmail={userEmail}
        />
      </main>
    </>
  );
}
