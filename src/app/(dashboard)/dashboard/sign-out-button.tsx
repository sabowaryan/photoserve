"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleLogout = async () => {
    // 1️⃣ Logout Supabase
    await fetch("/api/auth/logout", { method: "POST" });

    // 2️⃣ Logout NextAuth (supprime les cookies)
    await signOut({
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
