"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Loader2, 
  Monitor, 
  Smartphone, 
  Code, 
  FileText, 
  Send, 
  Copy, 
  Check 
} from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

interface TemplatePreviewModalProps {
  template: EmailTemplate;
  onClose: () => void;
}

/**
 * Template Preview Modal Component
 * 
 * Displays a preview of the email template with:
 * - Sample data form for variables
 * - Desktop/mobile preview toggle
 * - Test email sending functionality
 * - HTML/plain text view toggle
 * - Copy HTML functionality
 * 
 * Requirements: 7.6, 7.7
 */
export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewText, setPreviewText] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Preview options
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [contentType, setContentType] = useState<"html" | "text">("html");
  
  // Sample data for variables
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const [sampleDataJson, setSampleDataJson] = useState<string>("");
  
  // Test email
  const [testEmail, setTestEmail] = useState<string>("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  
  // Copy HTML
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initialize sample data from template variables
    const variables = (template.variables as any) || {};
    const initialData: Record<string, string> = {};
    
    if (Array.isArray(variables)) {
      variables.forEach((varName: string) => {
        initialData[varName] = `Sample ${varName}`;
      });
    } else if (typeof variables === 'object') {
      Object.keys(variables).forEach((key) => {
        initialData[key] = `Sample ${key}`;
      });
    }
    
    setSampleData(initialData);
    setSampleDataJson(JSON.stringify(initialData, null, 2));
    
    loadPreview(initialData);
  }, [template.id]);

  /**
   * Load template preview with sample data
   */
  const loadPreview = async (variables?: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/emails/templates/${template.id}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variables: variables || sampleData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      const { html, text, subject } = await response.json();
      setPreviewHtml(html);
      setPreviewText(text);
      setPreviewSubject(subject);
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Failed to load template preview");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update sample data from JSON editor
   */
  const handleSampleDataChange = (json: string) => {
    setSampleDataJson(json);
    try {
      const parsed = JSON.parse(json);
      setSampleData(parsed);
    } catch {
      // Invalid JSON, don't update sample data
    }
  };

  /**
   * Refresh preview with current sample data
   */
  const handleRefreshPreview = () => {
    try {
      const parsed = JSON.parse(sampleDataJson);
      setSampleData(parsed);
      loadPreview(parsed);
    } catch {
      setError("Invalid JSON in sample data");
    }
  };

  /**
   * Send test email
   */
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSendingTest(true);
    setError(null);
    setTestSent(false);

    try {
      const response = await fetch(
        `/api/emails/templates/${template.id}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: testEmail,
            variables: sampleData,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send test email");
      }

      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.error("Error sending test email:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send test email"
      );
    } finally {
      setSendingTest(false);
    }
  };

  /**
   * Copy HTML to clipboard
   */
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(previewHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying HTML:", err);
      setError("Failed to copy HTML to clipboard");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Template Preview
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{template.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Sample Data */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Sample Data
              </h3>
              <p className="text-xs text-slate-500">
                Edit the JSON below to customize preview variables
              </p>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <Textarea
                value={sampleDataJson}
                onChange={(e) => handleSampleDataChange(e.target.value)}
                className="font-mono text-xs min-h-[400px]"
                placeholder='{"variableName": "value"}'
              />
              
              <Button
                onClick={handleRefreshPreview}
                className="w-full mt-4"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh Preview"
                )}
              </Button>
            </div>

            {/* Test Email Section */}
            <div className="p-4 border-t border-slate-200">
              <Label htmlFor="test-email" className="text-sm font-semibold">
                Send Test Email
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTest}
                  disabled={sendingTest || !testEmail}
                  size="sm"
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : testSent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {testSent && (
                <p className="text-xs text-green-600 mt-2">
                  Test email sent successfully!
                </p>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Preview Controls */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "desktop" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("desktop")}
                    className="h-8"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "mobile" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("mobile")}
                    className="h-8"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Type Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={contentType === "html" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setContentType("html")}
                    className="h-8"
                  >
                    <Code className="h-4 w-4 mr-1" />
                    HTML
                  </Button>
                  <Button
                    variant={contentType === "text" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setContentType("text")}
                    className="h-8"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                </div>
              </div>

              {/* Copy HTML Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHtml}
                disabled={!previewHtml}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </>
                )}
              </Button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => loadPreview()}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* Subject Line */}
                  <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Subject:</p>
                    <p className="text-sm font-medium text-slate-900">
                      {previewSubject}
                    </p>
                  </div>

                  {/* HTML Preview */}
                  {contentType === "html" && (
                    <div
                      className={`bg-white border border-slate-200 rounded-lg overflow-hidden mx-auto transition-all ${
                        viewMode === "mobile" ? "max-w-[375px]" : "w-full"
                      }`}
                    >
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-[600px]"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}

                  {/* Plain Text Preview */}
                  {contentType === "text" && (
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-slate-900">
                        {previewText}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
