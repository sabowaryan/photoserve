"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

interface ExportButtonProps {
  onExport: (format: "csv" | "json") => Promise<void>;
}

/**
 * Export Button Component
 * 
 * Provides export functionality for analytics data in CSV or JSON format
 * 
 * Requirements: 8.6
 */
export function ExportButton({ onExport }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  /**
   * Handle export click
   */
  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      await onExport(format);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
