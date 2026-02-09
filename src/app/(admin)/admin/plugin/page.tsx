"use client";

import { useState, useCallback } from "react";
import { Package, Upload, BarChart3, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PluginVersionsTable, type PluginVersion } from "@/components/admin/plugin-versions-table";
import { PluginUploadForm } from "@/components/admin/plugin-upload-form";
import { PluginStatistics } from "@/components/admin/plugin-statistics";
import { UsageLogsTable } from "@/components/admin/usage-logs-table";

/**
 * Admin Plugin Management Page
 * 
 * Provides a tabbed interface for managing plugin versions, uploads, statistics, and usage logs.
 * Requirements: 10.1-10.11
 */
export default function AdminPluginPage() {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("versions");

  /**
   * Fetch plugin versions
   */
  const fetchVersions = useCallback(async () => {
    setIsLoadingVersions(true);
    setVersionsError(null);

    try {
      const response = await fetch("/api/admin/plugin/versions?includeUnstable=true");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch versions");
      }

      const data = await response.json();
      setVersions(data.versions);
    } catch (err) {
      setVersionsError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  /**
   * Toggle version stability
   */
  const handleToggleStability = async (versionId: string, currentStability: boolean) => {
    try {
      const response = await fetch(`/api/admin/plugin/versions/${versionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isStable: !currentStability,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update version");
      }

      // Refresh versions list
      await fetchVersions();
    } catch (err) {
      console.error("Failed to toggle stability:", err);
      alert(err instanceof Error ? err.message : "Failed to update version");
    }
  };

  /**
   * Delete version
   */
  const handleDeleteVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/plugin/versions/${versionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete version");
      }

      // Refresh versions list
      await fetchVersions();
    } catch (err) {
      console.error("Failed to delete version:", err);
      alert(err instanceof Error ? err.message : "Failed to delete version");
    }
  };

  /**
   * Handle successful upload
   */
  const handleUploadSuccess = () => {
    // Refresh versions list
    fetchVersions();
    // Switch to versions tab
    setActiveTab("versions");
  };

  // Fetch versions on mount
  useState(() => {
    fetchVersions();
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header - Removed, title is now in AdminHeader */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex bg-white rounded-2xl p-1 border border-slate-100">
          <TabsTrigger value="versions" className="gap-2 rounded-xl">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Versions</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 rounded-xl">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2 rounded-xl">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 rounded-xl">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Usage Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Versions */}
        <TabsContent value="versions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Manage plugin versions and their stability status
            </p>
            <Button onClick={() => setActiveTab("upload")} size="sm" className="rounded-xl">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Version
            </Button>
          </div>

          {versionsError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-[24px] p-6 text-center">
              <p className="text-rose-700 mb-4">{versionsError}</p>
              <Button onClick={fetchVersions} variant="outline" size="sm" className="rounded-xl">
                Retry
              </Button>
            </div>
          ) : (
            <PluginVersionsTable
              versions={versions}
              isLoading={isLoadingVersions}
              onToggleStability={handleToggleStability}
              onDelete={handleDeleteVersion}
            />
          )}
        </TabsContent>

        {/* Tab 2: Upload */}
        <TabsContent value="upload" className="space-y-4">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 mb-1">
              Upload New Plugin Version
            </h2>
            <p className="text-sm text-slate-600">
              Upload a new .lrplugin file and provide version details
            </p>
          </div>

          <div className="max-w-2xl">
            <PluginUploadForm onSuccess={handleUploadSuccess} />
          </div>
        </TabsContent>

        {/* Tab 3: Statistics */}
        <TabsContent value="statistics" className="space-y-4">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 mb-1">
              Plugin Usage Statistics
            </h2>
            <p className="text-sm text-slate-600">
              View analytics and insights about plugin usage
            </p>
          </div>

          <PluginStatistics />
        </TabsContent>

        {/* Tab 4: Usage Logs */}
        <TabsContent value="logs" className="space-y-4">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 mb-1">
              Usage Logs
            </h2>
            <p className="text-sm text-slate-600">
              View detailed logs of plugin actions and events
            </p>
          </div>

          <UsageLogsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
