"use client";

import { useState, useCallback } from "react";
import { Upload, FileUp, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface PluginUploadFormProps {
  onSuccess?: () => void;
}

/**
 * Plugin Upload Form Component
 * 
 * Provides a drag-and-drop interface for uploading plugin files with version metadata.
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function PluginUploadForm({ onSuccess }: PluginUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [minLightroomVersion, setMinLightroomVersion] = useState("11.0");
  const [isStable, setIsStable] = useState("false");

  // Validation
  const [versionError, setVersionError] = useState<string | null>(null);

  /**
   * Validate semantic version format
   */
  const validateVersion = (value: string): boolean => {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-z]+)?$/;
    if (!semverRegex.test(value)) {
      setVersionError("Version must follow semantic versioning (e.g., 1.0.0 or 1.0.0-beta)");
      return false;
    }
    setVersionError(null);
    return true;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setSuccess(false);

    // Validate file extension
    if (!selectedFile.name.toLowerCase().endsWith(".lrplugin")) {
      setError("File must have .lrplugin extension");
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size must not exceed 50MB");
      return;
    }

    setFile(selectedFile);
  }, []);

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  /**
   * Upload file and create version
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate form
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!version) {
      setError("Version number is required");
      return;
    }

    if (!validateVersion(version)) {
      return;
    }

    if (!changelog) {
      setError("Changelog is required");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to Cloudinary
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/admin/plugin/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || "Failed to upload file");
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(50);

      // Step 2: Create version record
      const versionResponse = await fetch("/api/admin/plugin/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.fileSize,
          changelog,
          isStable: isStable === "true",
          minLightroomVersion,
        }),
      });

      if (!versionResponse.ok) {
        const versionError = await versionResponse.json();
        throw new Error(versionError.error || "Failed to create version");
      }

      setUploadProgress(100);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setVersion("");
        setChangelog("");
        setMinLightroomVersion("11.0");
        setIsStable("false");
        setUploadProgress(0);
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <Label>Plugin File</Label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300"}
            ${file ? "bg-slate-50" : ""}
          `}
        >
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium mb-1">
                Drop your .lrplugin file here
              </p>
              <p className="text-sm text-slate-500 mb-4">
                or click to browse (max 50MB)
              </p>
              <input
                type="file"
                accept=".lrplugin"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-input")?.click()}
                disabled={isUploading}
              >
                Select File
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Version Number */}
      <div>
        <Label htmlFor="version">
          Version Number <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="version"
          type="text"
          placeholder="1.0.0"
          value={version}
          onChange={(e) => {
            setVersion(e.target.value);
            if (e.target.value) {
              validateVersion(e.target.value);
            } else {
              setVersionError(null);
            }
          }}
          disabled={isUploading}
          className={versionError ? "border-rose-500" : ""}
        />
        {versionError && (
          <p className="text-sm text-rose-600 mt-1">{versionError}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Must follow semantic versioning (e.g., 1.0.0 or 1.0.0-beta)
        </p>
      </div>

      {/* Changelog */}
      <div>
        <Label htmlFor="changelog">
          Changelog <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          id="changelog"
          placeholder="What's new in this version..."
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          disabled={isUploading}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          Markdown formatting supported
        </p>
      </div>

      {/* Minimum Lightroom Version */}
      <div>
        <Label htmlFor="minLightroomVersion">Minimum Lightroom Version</Label>
        <Input
          id="minLightroomVersion"
          type="text"
          placeholder="11.0"
          value={minLightroomVersion}
          onChange={(e) => setMinLightroomVersion(e.target.value)}
          disabled={isUploading}
        />
      </div>

      {/* Stability Status */}
      <div>
        <Label htmlFor="isStable">Stability Status</Label>
        <Select value={isStable} onValueChange={setIsStable} disabled={isUploading}>
          <SelectTrigger id="isStable">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Beta (Testing)</SelectItem>
            <SelectItem value="true">Stable (Production)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1">
          Only stable versions are visible to users
        </p>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Uploading...</span>
            <span className="font-medium text-slate-800">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-sm text-emerald-700">
            Plugin version uploaded successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isUploading || !file || !version || !changelog}
        className="w-full"
      >
        {isUploading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Plugin Version
          </>
        )}
      </Button>
    </form>
  );
}
