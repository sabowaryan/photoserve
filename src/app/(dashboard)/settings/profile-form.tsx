"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface ProfileFormProps {
  initialEmail: string;
  initialName: string;
}

export function ProfileForm({ initialEmail, initialName }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setMessage({ type: "success", text: "Profil mis à jour" });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={initialEmail}
          disabled
          className="bg-muted/50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
        />
      </div>
      {message && (
        <p
          className={`text-sm ${message.type === "success" ? "text-green-500" : "text-destructive"}`}
        >
          {message.text}
        </p>
      )}
      <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isSaving ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </div>
  );
}
