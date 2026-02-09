"use client";

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  History,
  Eye,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Clock,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface VersionHistoryProps {
  templateId: string;
  currentVersion: number;
  onVersionChange?: () => void;
}

/**
 * Version History Component
 * 
 * Displays version history for a template with preview and rollback functionality.
 * 
 * Requirements: 7.8, 7.9
 */
export function VersionHistory({
  templateId,
  currentVersion,
  onVersionChange,
}: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

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
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open version history dialog
   */
  const handleOpen = () => {
    setIsOpen(true);
    fetchVersions();
  };

  /**
   * Preview a specific version
   */
  const handlePreview = async (version: TemplateVersion) => {
    setSelectedVersion(version);
    setIsPreviewOpen(true);
    setIsLoadingPreview(true);

    try {
      const response = await fetch(
        `/api/emails/templates/${templateId}/versions/${version.version}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: {} }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to preview version");
      }

      const data = await response.json();
      setPreviewHtml(data.html);
    } catch (error) {
      console.error("Error previewing version:", error);
      toast.error("Failed to preview version");
      setIsPreviewOpen(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  /**
   * Publish a specific version
   */
  const handlePublish = async (version: number) => {
    try {
      const response = await fetch(
        `/api/emails/templates/${templateId}/versions/${version}/publish`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to publish version");
      }

      toast.success(`Version ${version} published successfully`);
      setIsOpen(false);
      onVersionChange?.();
    } catch (error) {
      console.error("Error publishing version:", error);
      toast.error("Failed to publish version");
    }
  };

  /**
   * Open rollback confirmation dialog
   */
  const handleOpenRollback = (version: TemplateVersion) => {
    setSelectedVersion(version);
    setIsRollbackOpen(true);
  };

  /**
   * Rollback to a previous version
   */
  const handleRollback = async () => {
    if (!selectedVersion) return;

    setIsRollingBack(true);

    try {
      const response = await fetch(
        `/api/emails/templates/${templateId}/versions/${selectedVersion.version}/rollback`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to rollback version");
      }

      toast.success(`Rolled back to version ${selectedVersion.version}`);
      setIsRollbackOpen(false);
      setIsOpen(false);
      onVersionChange?.();
    } catch (error) {
      console.error("Error rolling back version:", error);
      toast.error("Failed to rollback version");
    } finally {
      setIsRollingBack(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        Version History
      </Button>

      {/* Version History Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and manage previous versions of this template
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No version history available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Version</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-32">Created</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-48 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        v{version.version}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={version.subject}>
                          {version.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(version.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {version.version === currentVersion ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(version)}
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          {version.version !== currentVersion && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublish(version.version)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Publish
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRollback(version)}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Rollback
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Preview Version {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-lg bg-white">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[500px]"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={isRollbackOpen} onOpenChange={setIsRollbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to Version {selectedVersion?.version}?</DialogTitle>
            <DialogDescription>
              This will create a new version with the content from version{" "}
              {selectedVersion?.version}. The current version will be preserved in
              history.
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-3 py-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Subject</p>
                  <p className="text-sm text-slate-600">{selectedVersion.subject}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Created</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(selectedVersion.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRollbackOpen(false)}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRollback}
              disabled={isRollingBack}
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rolling back...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Rollback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
