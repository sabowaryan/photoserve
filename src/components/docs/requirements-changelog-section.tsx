'use client';

import { Monitor, Apple, HardDrive, Wifi, CheckCircle, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function RequirementsSection() {
  return (
    <div className="space-y-8">
      <p className="text-slate-600 leading-relaxed">
        Ensure your system meets these requirements before installing the PikSend Lightroom plugin.
      </p>

      {/* System Requirements Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Lightroom Version */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Monitor size={18} className="text-indigo-600" />
              Adobe Lightroom
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Minimum Version:</strong>
              </p>
              <p className="text-lg font-bold text-slate-900">Lightroom Classic 11.0 or later</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900">
                <strong>Note:</strong> Lightroom CC (cloud-based) is not currently supported. 
                Only Lightroom Classic is compatible.
              </p>
            </div>
          </div>
        </div>

        {/* Operating System */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Apple size={18} className="text-slate-600" />
              Operating System
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Supported Platforms:</strong>
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-900">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm">Windows 10 or later (64-bit)</span>
                </li>
                <li className="flex items-center gap-2 text-slate-900">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm">macOS 10.15 (Catalina) or later</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <HardDrive size={18} className="text-purple-600" />
              Storage
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Disk Space Required:</strong>
              </p>
              <p className="text-lg font-bold text-slate-900">5 MB for plugin files</p>
            </div>
            <p className="text-xs text-slate-600">
              Additional space needed for temporary export files during upload (varies by photo size)
            </p>
          </div>
        </div>

        {/* Internet Connection */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Wifi size={18} className="text-emerald-600" />
              Internet Connection
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Recommended:</strong>
              </p>
              <p className="text-lg font-bold text-slate-900">5 Mbps upload speed or faster</p>
            </div>
            <p className="text-xs text-slate-600">
              Faster upload speeds will significantly improve photo upload times
            </p>
          </div>
        </div>
      </div>

      {/* Account Requirements */}
      <div className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-3">
          <CheckCircle size={20} />
          Account Requirements
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900 text-sm">Active PikSend Account</p>
              <p className="text-sm text-indigo-800">You must have a registered PikSend account</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900 text-sm">Pro Plan Subscription</p>
              <p className="text-sm text-indigo-800">
                The Lightroom plugin is a Pro feature. <Link href="/pricing" className="text-indigo-600 hover:underline">Upgrade to Pro</Link> to use it.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900 text-sm">API Key</p>
              <p className="text-sm text-indigo-800">
                Generate an API key from your <Link href="/settings/api-keys" className="text-indigo-600 hover:underline">dashboard settings</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility Notes */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">Compatibility Notes</h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-1">•</span>
            <span>The plugin is compatible with both Intel and Apple Silicon (M1/M2/M3) Macs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-1">•</span>
            <span>Lightroom CC (cloud-based version) is not supported - only Lightroom Classic</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-1">•</span>
            <span>The plugin requires an active internet connection to function</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-1">•</span>
            <span>Some antivirus software may need to whitelist Lightroom for uploads to work</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function ChangelogSection() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-slate-600 leading-relaxed">
          View the complete version history and updates for the PikSend Lightroom plugin.
        </p>
        <Link
          href="/download/lightroom"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Download size={16} />
          Download Latest
        </Link>
      </div>

      {/* Current Version */}
      <div className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-green-100 border-b border-green-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-green-900 flex items-center gap-2">
              <CheckCircle size={18} />
              Version 1.0.0 (Current)
            </h3>
            <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-medium">
              Latest Stable
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">Released: February 4, 2026</p>
        </div>
        <div className="p-6">
          <h4 className="font-bold text-slate-900 text-sm mb-3">Initial Release</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Direct photo upload from Lightroom to PikSend galleries</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Secure API key authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Create and manage galleries from within Lightroom</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Batch upload support with progress tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Customizable export settings (quality, size, format)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Support for Lightroom Classic 11.0 and later</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Cross-platform support (Windows and macOS)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>Comprehensive error handling and logging</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Future Updates */}
      <div className="border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ExternalLink size={20} className="text-slate-600" />
          Planned Features
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          We're constantly improving the plugin. Here are some features we're working on:
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Automatic update notifications within Lightroom</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Preset management for export settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Bulk gallery operations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Enhanced metadata synchronization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Support for video files</span>
          </li>
        </ul>
      </div>

      {/* Version History Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        <p>
          <strong>Note:</strong> This is the initial release of the PikSend Lightroom plugin. 
          Future versions will be listed here with detailed changelogs. Check back regularly for updates!
        </p>
      </div>
    </div>
  );
}
