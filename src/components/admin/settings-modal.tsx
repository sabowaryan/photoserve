"use client";

import { X, Settings as SettingsIcon, CreditCard, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const quickSettings = [
    {
      icon: <SettingsIcon size={20} />,
      title: "General Settings",
      description: "Platform configuration and preferences",
      href: "/admin/settings",
      color: "bg-slate-100 text-slate-600",
    },
    {
      icon: <CreditCard size={20} />,
      title: "Stripe Payments",
      description: "Manage payment processing features",
      href: "/admin/settings",
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      icon: <Sparkles size={20} />,
      title: "AI Features",
      description: "Configure AI-powered capabilities",
      href: "/admin/settings",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Quick Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Access platform configuration</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {quickSettings.map((setting, index) => (
            <Link
              key={index}
              href={setting.href}
              onClick={onClose}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${setting.color} flex items-center justify-center flex-shrink-0`}>
                {setting.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-0.5">{setting.title}</h3>
                <p className="text-xs text-slate-500">{setting.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Link
            href="/admin/settings"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <SettingsIcon size={16} />
            Open Full Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
