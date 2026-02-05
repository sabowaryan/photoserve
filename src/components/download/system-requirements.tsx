'use client';

import { Monitor, Apple, HardDrive, CheckCircle } from 'lucide-react';

interface SystemRequirementsProps {
  minLightroomVersion: string;
}

export function SystemRequirements({ minLightroomVersion }: SystemRequirementsProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">System Requirements</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Minimum Lightroom Version */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Adobe Lightroom Classic</h3>
            <p className="text-slate-600 text-sm">
              Version <span className="font-semibold text-slate-900">{minLightroomVersion}</span> or later required
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Compatible with both subscription and perpetual license versions
            </p>
          </div>
        </div>

        {/* Supported Operating Systems */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Supported Operating Systems</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Windows */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <Monitor size={20} className="text-blue-600" />
                <h4 className="font-semibold text-slate-900">Windows</h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Windows 10 (64-bit) or later</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Windows 11 (64-bit)</span>
                </li>
              </ul>
            </div>

            {/* macOS */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <Apple size={20} className="text-slate-600" />
                <h4 className="font-semibold text-slate-900">macOS</h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>macOS 10.15 (Catalina) or later</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Intel and Apple Silicon (M1/M2/M3) supported</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disk Space */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <HardDrive size={20} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Disk Space</h3>
            <p className="text-slate-600 text-sm">
              Minimum <span className="font-semibold text-slate-900">10 MB</span> of free disk space required for plugin installation
            </p>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">Additional Requirements</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Active internet connection for uploading images</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>PikSend Pro plan subscription</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Valid API key (generated from your PikSend account)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
