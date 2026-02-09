"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitCompare, Loader2 } from "lucide-react";

interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject: string;
  content: any;
  variables: string[];
  created_by: string | null;
  created_at: string;
}

interface VersionComparisonProps {
  templateId: string;
  currentVersion: number;
}

/**
 * Version Comparison Component
 * 
 * Allows side-by-side comparison of two template versions.
 * 
 * Requirements: 7.8
 */
export function VersionComparison({
  templateId,
  currentVersion,
}: VersionComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leftVersion, setLeftVersion] = useState<number | null>(null);
  const [rightVersion, setRightVersion] = useState<number | null>(null);
  const [leftHtml, setLeftHtml] = useState("");
  const [rightHtml, setRightHtml] = useState("");
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);

  /**
   * Fetch version history
   */
  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/emails/templates/${templateId}/versions`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }

      const data = await response.json();
      const versionList = data.versions || [];
      setVersions(versionList);

      // Auto-select current version and previous version for comparison
      if (versionList.length >= 2) {
        setRightVersion(currentVersion);
        const previousVersion = versionList.find(
          (v: TemplateVersion) => v.version === currentVersion - 1
        );
        if (previousVersion) {
          setLeftVersion(previousVersion.version);
        }
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load previews for selected versions
   */
  const loadPreviews = async () => {
    if (leftVersion === null || rightVersion === null) return;

    setIsLoadingPreviews(true);

    try {
      // Load left version preview
      const leftResponse = await fetch(
        `/api/emails/templates/${templateId}/versions/${leftVersion}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: {} }),
        }
      );

      if (!leftResponse.ok) {
        throw new Error("Failed to load left version preview");
      }

      const leftData = await leftResponse.json();
      setLeftHtml(leftData.html);

      // Load right version preview
      const rightResponse = await fetch(
        `/api/emails/templates/${templateId}/versions/${rightVersion}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: {} }),
        }
      );

      if (!rightResponse.ok) {
        throw new Error("Failed to load right version preview");
      }

      const rightData = await rightResponse.json();
      setRightHtml(rightData.html);
    } catch (error) {
      console.error("Error loading previews:", error);
      toast.error("Failed to load version previews");
    } finally {
      setIsLoadingPreviews(false);
    }
  };

  /**
   * Open comparison dialog
   */
  const handleOpen = () => {
    setIsOpen(true);
    fetchVersions();
  };

  /**
   * Handle version selection change
   */
  useEffect(() => {
    if (leftVersion !== null && rightVersion !== null) {
      loadPreviews();
    }
  }, [leftVersion, rightVersion]);

  /**
   * Get version details
   */
  const getVersionDetails = (versionNumber: number | null) => {
    if (versionNumber === null) return null;
    return versions.find((v) => v.version === versionNumber);
  };

  const leftVersionDetails = getVersionDetails(leftVersion);
  const rightVersionDetails = getVersionDetails(rightVersion);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2"
      >
        <GitCompare className="h-4 w-4" />
        Compare Versions
      </Button>

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Compare Template Versions</DialogTitle>
            <DialogDescription>
              Select two versions to compare side-by-side
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Version Selectors */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <Label>Left Version</Label>
                  <Select
                    value={leftVersion?.toString() || ""}
                    onValueChange={(value) => setLeftVersion(parseInt(value, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem
                          key={version.id}
                          value={version.version.toString()}
                          disabled={version.version === rightVersion}
                        >
                          v{version.version}
                          {version.version === currentVersion && " (Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leftVersionDetails && (
                    <div className="text-sm text-slate-600">
                      <p className="font-medium truncate">
                        {leftVersionDetails.subject}
                      </p>
                      <p className="text-xs">
                        {new Date(leftVersionDetails.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Right Version</Label>
                  <Select
                    value={rightVersion?.toString() || ""}
                    onValueChange={(value) => setRightVersion(parseInt(value, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem
                          key={version.id}
                          value={version.version.toString()}
                          disabled={version.version === leftVersion}
                        >
                          v{version.version}
                          {version.version === currentVersion && " (Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rightVersionDetails && (
                    <div className="text-sm text-slate-600">
                      <p className="font-medium truncate">
                        {rightVersionDetails.subject}
                      </p>
                      <p className="text-xs">
                        {new Date(rightVersionDetails.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison View */}
              <div className="flex-1 overflow-hidden">
                {leftVersion === null || rightVersion === null ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p>Select two versions to compare</p>
                  </div>
                ) : isLoadingPreviews ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Left Preview */}
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <Badge variant="secondary">v{leftVersion}</Badge>
                        {leftVersion === currentVersion && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <iframe
                          srcDoc={leftHtml}
                          className="w-full h-full"
                          title={`Version ${leftVersion} Preview`}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>

                    {/* Right Preview */}
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <Badge variant="secondary">v{rightVersion}</Badge>
                        {rightVersion === currentVersion && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <iframe
                          srcDoc={rightHtml}
                          className="w-full h-full"
                          title={`Version ${rightVersion} Preview`}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
