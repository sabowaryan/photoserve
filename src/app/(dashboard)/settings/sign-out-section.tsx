"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutSection() {
  const handleSignOut = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <div className="pt-2">
      <Button variant="destructive" onClick={handleSignOut}>
        Se déconnecter
      </Button>
    </div>
  );
}
