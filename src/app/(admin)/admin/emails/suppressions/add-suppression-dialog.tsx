"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddSuppressionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string, reason: string, bounceType?: string) => Promise<void>;
}

/**
 * Add Suppression Dialog Component
 * 
 * Allows admins to manually add email addresses to the suppression list
 * 
 * Requirements: 8.8
 */
export function AddSuppressionDialog({
  isOpen,
  onClose,
  onAdd,
}: AddSuppressionDialogProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<string>("bounce");
  const [bounceType, setBounceType] = useState<string>("hard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await onAdd(
        email.trim(),
        reason,
        reason === "bounce" ? bounceType : undefined
      );
      
      // Reset form
      setEmail("");
      setReason("bounce");
      setBounceType("hard");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to add suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setReason("bounce");
      setBounceType("hard");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Email Suppression</DialogTitle>
          <DialogDescription>
            Manually add an email address to the suppression list to prevent
            future emails from being sent to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Reason Select */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={reason} onValueChange={setReason} disabled={loading}>
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bounce Type Select (only for bounces) */}
            {reason === "bounce" && (
              <div className="space-y-2">
                <Label htmlFor="bounceType">Bounce Type</Label>
                <Select
                  value={bounceType}
                  onValueChange={setBounceType}
                  disabled={loading}
                >
                  <SelectTrigger id="bounceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard">Hard Bounce</SelectItem>
                    <SelectItem value="soft">Soft Bounce</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Hard bounces are permanent failures (invalid email). Soft bounces
                  are temporary (mailbox full, server down).
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Suppression"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
