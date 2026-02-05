'use client';

import { Monitor, Apple, CheckCircle, AlertTriangle } from 'lucide-react';

export function InstallationSection() {
  return (
    <div className="space-y-8">
      <p className="text-slate-600 leading-relaxed">
        Follow these step-by-step instructions to install the PikSend Lightroom plugin on your system.
        The installation process is straightforward and takes just a few minutes.
      </p>

      {/* Windows Installation */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <Monitor size={20} className="text-blue-600" />
            Windows Installation
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Download the Plugin</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Visit the <a href="/download/lightroom" className="text-indigo-600 hover:underline">download page</a> and 
                  click the download button. The plugin file will be saved as <code className="px-2 py-1 bg-slate-100 rounded text-xs">PikSend.lrplugin</code>.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    <strong>Note:</strong> You must have a Pro plan to download and use the plugin.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Locate the Lightroom Plugins Folder</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Open File Explorer and navigate to one of these locations:
                </p>
                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">User-specific location (recommended):</p>
                    <code className="text-xs text-slate-900 font-mono">
                      C:\Users\[YourUsername]\AppData\Roaming\Adobe\Lightroom\Modules
                    </code>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">System-wide location:</p>
                    <code className="text-xs text-slate-900 font-mono">
                      C:\Program Files\Adobe\Adobe Lightroom\Modules
                    </code>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3">
                  If the <code className="px-2 py-1 bg-slate-100 rounded text-xs">Modules</code> folder doesn't exist, create it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Copy the Plugin</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Copy the <code className="px-2 py-1 bg-slate-100 rounded text-xs">PikSend.lrplugin</code> folder 
                  to the Modules folder you located in step 2.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-900">
                    <strong>Important:</strong> Copy the entire .lrplugin folder, not just the files inside it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Restart Lightroom</h4>
                <p className="text-slate-600 text-sm">
                  Close and restart Adobe Lightroom. The plugin will be automatically loaded on startup.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                <CheckCircle size={16} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Verify Installation</h4>
                <p className="text-slate-600 text-sm mb-3">
                  In Lightroom, go to <strong>File → Plug-in Manager</strong>. You should see "PikSend" 
                  listed in the plugins. If it shows "Installed and running", the installation was successful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* macOS Installation */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <Apple size={20} className="text-slate-600" />
            macOS Installation
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Download the Plugin</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Visit the <a href="/download/lightroom" className="text-indigo-600 hover:underline">download page</a> and 
                  click the download button. The plugin file will be saved as <code className="px-2 py-1 bg-slate-100 rounded text-xs">PikSend.lrplugin</code>.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    <strong>Note:</strong> You must have a Pro plan to download and use the plugin.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Locate the Lightroom Plugins Folder</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Open Finder and navigate to one of these locations:
                </p>
                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">User-specific location (recommended):</p>
                    <code className="text-xs text-slate-900 font-mono">
                      ~/Library/Application Support/Adobe/Lightroom/Modules
                    </code>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">System-wide location:</p>
                    <code className="text-xs text-slate-900 font-mono">
                      /Library/Application Support/Adobe/Lightroom/Modules
                    </code>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3">
                  <strong>Tip:</strong> To access the Library folder, press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">⌘ + Shift + G</kbd> in 
                  Finder and paste the path above.
                </p>
                <p className="text-slate-600 text-sm mt-2">
                  If the <code className="px-2 py-1 bg-slate-100 rounded text-xs">Modules</code> folder doesn't exist, create it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Copy the Plugin</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Copy the <code className="px-2 py-1 bg-slate-100 rounded text-xs">PikSend.lrplugin</code> folder 
                  to the Modules folder you located in step 2.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-900">
                    <strong>Important:</strong> Copy the entire .lrplugin folder, not just the files inside it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Restart Lightroom</h4>
                <p className="text-slate-600 text-sm">
                  Close and restart Adobe Lightroom. The plugin will be automatically loaded on startup.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                <CheckCircle size={16} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">Verify Installation</h4>
                <p className="text-slate-600 text-sm mb-3">
                  In Lightroom, go to <strong>File → Plug-in Manager</strong> (or <strong>Lightroom → Plug-in Manager</strong> on newer versions). 
                  You should see "PikSend" listed in the plugins. If it shows "Installed and running", the installation was successful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Installation Issues */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-3">
          <AlertTriangle size={20} />
          Common Installation Issues
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-2">Plugin doesn't appear in Plug-in Manager</h4>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>Verify you copied the entire .lrplugin folder, not just the contents</li>
              <li>Check that the folder is in the correct Modules directory</li>
              <li>Ensure Lightroom was completely restarted after installation</li>
              <li>Try copying to the user-specific location instead of system-wide</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-2">Plugin shows as "Not loaded" or "Error"</h4>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>Check that you're using a compatible Lightroom version (11.0 or later)</li>
              <li>Verify the plugin files weren't corrupted during download</li>
              <li>Try re-downloading and reinstalling the plugin</li>
              <li>Check the Lightroom log file for specific error messages</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-2">Permission issues on macOS</h4>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>Grant Lightroom full disk access in System Preferences → Security & Privacy</li>
              <li>Use the user-specific Library folder instead of the system Library</li>
              <li>Check folder permissions with Get Info (⌘ + I)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
