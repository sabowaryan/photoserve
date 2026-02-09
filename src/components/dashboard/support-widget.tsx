"use client";

import { useState } from "react";
import { HelpCircle, Mail, MessageCircle, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SupportWidgetProps {
  userEmail?: string;
}

/**
 * Support Widget Component
 * 
 * Provides accessible support options for users:
 * - Email support
 * - Help documentation
 * - Quick links to common resources
 * 
 * Requirements: 13.7 - Accessible support widget
 */
export function SupportWidget({ userEmail }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
        aria-label="Ouvrir le support"
      >
        {isOpen ? (
          <X size={24} className="transition-transform group-hover:rotate-90" />
        ) : (
          <HelpCircle size={24} className="transition-transform group-hover:rotate-12" />
        )}
      </button>

      {/* Support Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 rounded-t-2xl">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <HelpCircle size={20} />
              Besoin d'aide ?
            </h3>
            <p className="text-white/80 text-sm mt-1">
              Nous sommes là pour vous aider
            </p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Email Support */}
            <Link
              href={`mailto:support@piksend.com${userEmail ? `?subject=Support Request from ${userEmail}` : ''}`}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group border border-slate-100"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <Mail size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                  Email Support
                </h4>
                <p className="text-xs text-slate-500">
                  Réponse sous 24h
                </p>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>

            {/* Live Chat (placeholder for future integration) */}
            <button
              onClick={() => {
                // TODO: Integrate with Intercom/Crisp when available
                alert("Le chat en direct sera bientôt disponible. Pour l'instant, contactez-nous par email.");
              }}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group border border-slate-100 text-left"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <MessageCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                  Chat en direct
                </h4>
                <p className="text-xs text-slate-500">
                  Bientôt disponible
                </p>
              </div>
            </button>

            {/* Help Documentation */}
            <Link
              href="/help"
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group border border-slate-100"
            >
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                <HelpCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                  Centre d'aide
                </h4>
                <p className="text-xs text-slate-500">
                  Guides et tutoriels
                </p>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
            </Link>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <p className="text-xs text-slate-500 text-center">
              Support disponible 7j/7
            </p>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
