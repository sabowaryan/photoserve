'use client';

import Link from 'next/link';
import { FileDown, FolderOpen, RotateCw, CheckCircle, BookOpen } from 'lucide-react';

export function InstallationInstructions() {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Quick Start Guide</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <p className="text-slate-600">
          Get started with the PikSend Lightroom plugin in just a few simple steps:
        </p>

        {/* Quick Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileDown size={18} className="text-green-600" />
                <h3 className="font-semibold text-slate-900">Download the Plugin</h3>
              </div>
              <p className="text-sm text-slate-600">
                Click the download button above to get the latest version of the plugin.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={18} className="text-green-600" />
                <h3 className="font-semibold text-slate-900">Install to Lightroom</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Copy the <code className="px-2 py-1 bg-slate-100 rounded text-xs">PikSend.lrplugin</code> folder 
                to your Lightroom Modules directory:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Windows:</p>
                  <code className="text-xs text-slate-900 font-mono block">
                    C:\Users\[YourUsername]\AppData\Roaming\Adobe\Lightroom\Modules
                  </code>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">macOS:</p>
                  <code className="text-xs text-slate-900 font-mono block">
                    ~/Library/Application Support/Adobe/Lightroom/Modules
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <RotateCw size={18} className="text-green-600" />
                <h3 className="font-semibold text-slate-900">Restart Lightroom</h3>
              </div>
              <p className="text-sm text-slate-600">
                Close and restart Adobe Lightroom to load the plugin.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-600" />
                <h3 className="font-semibold text-slate-900">Configure API Key</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Generate an API key from your{' '}
                <Link href="/settings/api-keys" className="text-indigo-600 hover:underline font-medium">
                  account settings
                </Link>{' '}
                and enter it in the plugin to authenticate.
              </p>
            </div>
          </div>
        </div>

        {/* Full Documentation Link */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-1">Need More Help?</h3>
              <p className="text-sm text-indigo-800 mb-3">
                Check out our comprehensive documentation for detailed installation instructions, 
                troubleshooting tips, and usage guides.
              </p>
              <Link
                href="/docs/lightroom"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View Full Documentation
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
