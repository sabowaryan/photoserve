"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import dynamic from "next/dynamic";

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

    /**
     * Expose editor methods to parent component
     */
    useImperativeHandle(ref, () => ({
      exportHtml: (callback: (data: any) => void) => {
        if (emailEditorRef.current?.editor) {
          emailEditorRef.current.editor.exportHtml(callback);
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
      // Load initial design if provided
      if (initialDesign && emailEditorRef.current?.editor) {
        emailEditorRef.current.editor.loadDesign(initialDesign);
      }
    };

    return (
      <div className="email-editor-container">
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
