"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AlertCircle } from "lucide-react";

// Dynamically import EmailEditor to avoid SSR issues
const EmailEditorComponent = dynamic(
  () => import("react-email-editor").then((mod) => mod.EmailEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Loading email editor...</p>
          <p className="text-xs text-slate-400 mt-2">This may take a few seconds</p>
        </div>
      </div>
    ),
  }
);

interface EmailEditorProps {
  initialDesign?: any;
}

/**
 * Email Editor Component
 * 
 * Wraps the react-email-editor (Unlayer) with a clean interface.
 * Provides drag-and-drop email template building capabilities.
 * 
 * Features:
 * - Drag-and-drop components (text, image, button, divider, spacer, social)
 * - Responsive design preview
 * - Export HTML and design JSON
 * 
 * Requirements: 7.3, 7.4
 */
export const EmailEditor = forwardRef<any, EmailEditorProps>(
  ({ initialDesign }, ref) => {
    const emailEditorRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
      // Set a timeout to detect if editor fails to load
      const timeout = setTimeout(() => {
        if (!isReady) {
          setLoadError(true);
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    }, [isReady]);

    /**
     * Expose editor methods to parent component
     */
    useImperativeHandle(ref, () => ({
      exportHtml: (callback: (data: any) => void) => {
        if (emailEditorRef.current?.editor) {
          emailEditorRef.current.editor.exportHtml(callback);
        } else {
          console.error("Email editor not ready");
        }
      },
      saveDesign: (callback: (data: any) => void) => {
        if (emailEditorRef.current?.editor) {
          emailEditorRef.current.editor.saveDesign(callback);
        }
      },
      loadDesign: (design: any) => {
        if (emailEditorRef.current?.editor) {
          emailEditorRef.current.editor.loadDesign(design);
        }
      },
    }));

    /**
     * Handle editor ready event
     */
    const onReady = () => {
      console.log("Email editor ready");
      setIsReady(true);
      setLoadError(false);
      
      // Load initial design if provided
      if (initialDesign && emailEditorRef.current?.editor) {
        emailEditorRef.current.editor.loadDesign(initialDesign);
      }
    };

    if (loadError) {
      return (
        <div className="flex items-center justify-center h-[600px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Editor Loading Issue
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              The email editor is taking longer than expected to load. This might be due to:
            </p>
            <ul className="text-xs text-slate-500 text-left space-y-1 mb-4">
              <li>• Slow internet connection</li>
              <li>• Browser extensions blocking scripts</li>
              <li>• Ad blockers interfering with the editor</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="email-editor-container">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
              <p className="text-sm text-slate-600">Initializing editor...</p>
            </div>
          </div>
        )}
        <EmailEditorComponent
          ref={emailEditorRef}
          onReady={onReady}
          minHeight="600px"
          options={{
            displayMode: "email",
            projectId: process.env.NEXT_PUBLIC_UNLAYER_PROJECT_ID || undefined,
            appearance: {
              theme: "light",
              panels: {
                tools: {
                  dock: "left",
                },
              },
            },
            features: {
              textEditor: {
                spellChecker: true,
              },
            },
            tools: {
              // Enable standard email components
              text: { enabled: true },
              image: { enabled: true },
              button: { enabled: true },
              divider: { enabled: true },
              spacer: { enabled: true },
              social: { enabled: true },
              html: { enabled: true },
              video: { enabled: true },
              // Disable advanced features for simplicity
              form: { enabled: false },
              timer: { enabled: false },
            },
            mergeTags: {
              // Common email variables
              appName: {
                name: "App Name",
                value: "{{appName}}",
              },
              appUrl: {
                name: "App URL",
                value: "{{appUrl}}",
              },
              supportEmail: {
                name: "Support Email",
                value: "{{supportEmail}}",
              },
              recipientEmail: {
                name: "Recipient Email",
                value: "{{recipientEmail}}",
              },
              recipientName: {
                name: "Recipient Name",
                value: "{{recipientName}}",
              },
              photographerName: {
                name: "Photographer Name",
                value: "{{photographerName}}",
              },
              galleryName: {
                name: "Gallery Name",
                value: "{{galleryName}}",
              },
              unsubscribeUrl: {
                name: "Unsubscribe URL",
                value: "{{unsubscribeUrl}}",
              },
            },
          }}
        />
      </div>
    );
  }
);

EmailEditor.displayName = "EmailEditor";
