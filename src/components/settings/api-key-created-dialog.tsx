"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface APIKeyCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  keyName: string;
}

/**
 * API Key Created Dialog Component
 * 
 * Displays the complete API key after creation with copy functionality
 * Requirements: 1.3, 7.4, 7.5
 */
export function APIKeyCreatedDialog({ 
  open, 
  onOpenChange, 
  apiKey, 
  keyName 
}: APIKeyCreatedDialogProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    if (acknowledged) {
      setAcknowledged(false);
      setCopied(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            API Key Created Successfully
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your API key "{keyName}" has been created. Copy it now and store it securely.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900 text-sm">
                  This key will only be shown once
                </p>
                <p className="text-sm text-amber-800">
                  Make sure to copy your API key now. You won't be able to see it again after closing this dialog.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Your API Key
            </label>
            <div className="relative">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm break-all select-all">
                {apiKey}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="absolute top-2 right-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 text-sm mb-2">
              Next Steps
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
              <li>Copy the API key above</li>
              <li>Open Adobe Lightroom Classic</li>
              <li>Go to File → Plug-in Manager</li>
              <li>Select PikSend and enter your API key</li>
              <li>Start uploading your photos!</li>
            </ol>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="acknowledge" className="text-sm text-slate-700 cursor-pointer">
              I have copied and securely stored my API key. I understand that I won't be able to see it again.
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            onClick={handleClose}
            disabled={!acknowledged}
            className="w-full sm:w-auto"
          >
            I've Saved My Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
