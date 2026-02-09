"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Braces, Plus, X } from "lucide-react";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
  onClose: () => void;
  existingVariables: string[];
}

/**
 * Common email template variables
 */
const COMMON_VARIABLES = [
  { name: "appName", description: "Application name (PikSend)" },
  { name: "appUrl", description: "Application URL" },
  { name: "supportEmail", description: "Support email address" },
  { name: "recipientEmail", description: "Recipient's email address" },
  { name: "recipientName", description: "Recipient's name" },
  { name: "photographerName", description: "Photographer's name" },
  { name: "photographerEmail", description: "Photographer's email" },
  { name: "galleryName", description: "Gallery name" },
  { name: "photoCount", description: "Number of photos" },
  { name: "amountPaid", description: "Amount paid (formatted)" },
  { name: "transactionId", description: "Transaction ID" },
  { name: "purchaseDate", description: "Purchase date" },
  { name: "accessLink", description: "Gallery access link" },
  { name: "unsubscribeUrl", description: "Unsubscribe URL (marketing emails)" },
];

/**
 * Variable Inserter Component
 * 
 * Modal dialog for adding variables to email templates.
 * Provides a list of common variables and allows custom variables.
 * 
 * Requirements: 7.4
 */
export function VariableInserter({
  onInsert,
  onClose,
  existingVariables,
}: VariableInserterProps) {
  const [customVariable, setCustomVariable] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Filter variables based on search query
   */
  const filteredVariables = COMMON_VARIABLES.filter(
    (variable) =>
      variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Handle inserting a common variable
   */
  const handleInsertCommon = (variableName: string) => {
    onInsert(variableName);
  };

  /**
   * Handle inserting a custom variable
   */
  const handleInsertCustom = () => {
    if (!customVariable.trim()) {
      return;
    }

    // Validate variable name (alphanumeric and underscores only)
    const validVariableName = customVariable
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "");

    if (!validVariableName) {
      return;
    }

    onInsert(validVariableName);
    setCustomVariable("");
  };

  /**
   * Check if variable is already added
   */
  const isVariableAdded = (variableName: string) => {
    return existingVariables.includes(variableName);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Template Variable</DialogTitle>
          <DialogDescription>
            Select a common variable or create a custom one. Variables can be
            used in the subject line and email body using {"{{variableName}}"}{" "}
            syntax.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Variables</Label>
            <Input
              id="search"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Common Variables */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Common Variables
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {filteredVariables.map((variable) => {
                const isAdded = isVariableAdded(variable.name);
                return (
                  <div
                    key={variable.name}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-slate-900">
                          {"{{"}{variable.name}{"}}"}
                        </code>
                        {isAdded && (
                          <Badge variant="secondary" className="text-xs">
                            Added
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {variable.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAdded ? "outline" : "default"}
                      onClick={() => handleInsertCommon(variable.name)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <>
                          <Braces className="h-4 w-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Variable */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Custom Variable
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g., customField"
                  value={customVariable}
                  onChange={(e) => setCustomVariable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInsertCustom();
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use alphanumeric characters and underscores only
                </p>
              </div>
              <Button
                onClick={handleInsertCustom}
                disabled={!customVariable.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
