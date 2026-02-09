"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, CheckCircle, AlertCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type SenderAddress = Database["public"]["Tables"]["sender_addresses"]["Row"];

interface AddSenderFormProps {
  onSenderAdded: (sender: SenderAddress) => void;
}

/**
 * Add Sender Form Component
 * 
 * Form for adding new sender email addresses with:
 * - Email and name input fields
 * - Validation
 * - Success/error feedback
 * - Automatic verification initiation
 * 
 * Requirements: 6.4, 6.5
 */
export function AddSenderForm({ onSenderAdded }: AddSenderFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Validate email
      if (!email) {
        throw new Error("Email is required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      // Submit to API
      const response = await fetch("/api/admin/emails/senders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add sender address");
      }

      const result = await response.json();

      // Clear form
      setEmail("");
      setName("");

      // Show success message
      setMessage({
        type: "success",
        text: "Sender address added successfully. Please verify the domain to start sending emails.",
      });

      // Notify parent
      onSenderAdded(result.sender);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (error) {
      console.error("Error adding sender:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to add sender address",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Add Sender Address
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Add a new email address to send emails from
      </p>

      {/* Message Display */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Input */}
          <div>
            <Label htmlFor="sender-email" className="text-slate-700 mb-2 block">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
                <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id="sender-email"
              type="email"
              placeholder="noreply@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Name Input */}
          <div>
            <Label htmlFor="sender-name" className="text-slate-700 mb-2 block">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </div>
            </Label>
            <Input
              id="sender-name"
              type="text"
              placeholder="Your Company"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Add Sender Address
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
