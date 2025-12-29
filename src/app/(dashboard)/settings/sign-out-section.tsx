"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutSection() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="pt-2">
      <Button variant="destructive" onClick={handleSignOut}>
        Se déconnecter
      </Button>
    </div>
  );
}
