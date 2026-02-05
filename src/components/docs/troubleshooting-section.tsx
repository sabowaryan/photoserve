'use client';

import { AlertCircle, FileText, Mail, MessageCircle, ExternalLink } from 'lucide-react';

export function TroubleshootingSection() {
  return (
    <div className="space-y-8">
      <p className="text-slate-600 leading-relaxed">
        If you encounter issues with the PikSend Lightroom plugin, check these common problems and solutions. 
        If your issue isn't listed here, contact our support team for assistance.
      </p>

      {/* Common Errors */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Common Errors and Solutions</h3>

        {/* Authentication Errors */}
        <div className="border border-red-200 bg-red-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-red-100 border-b border-red-200">
            <h4 className="font-bold text-red-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Authentication Failed / Invalid API Key
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-red-900">
              <strong>Symptoms:</strong> Error message "Authentication failed" or "Invalid API key" when trying to connect or upload.
            </p>
            <div className="text-sm text-red-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verify you copied the entire API key without extra spaces</li>
                <li>Check that the API key hasn't expired (check expiration date in dashboard)</li>
                <li>Ensure the API key hasn't been revoked or deleted</li>
                <li>Verify your Pro plan subscription is active</li>
                <li>Try generating a new API key and updating it in Lightroom</li>
                <li>Check your internet connection is working</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Failures */}
        <div className="border border-orange-200 bg-orange-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-orange-100 border-b border-orange-200">
            <h4 className="font-bold text-orange-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Upload Failed / Timeout Errors
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-orange-900">
              <strong>Symptoms:</strong> Photos fail to upload, timeout errors, or uploads get stuck at a certain percentage.
            </p>
            <div className="text-sm text-orange-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your internet connection speed and stability</li>
                <li>Try uploading fewer photos at once (batches of 20-50)</li>
                <li>Reduce export quality or image size if files are very large</li>
                <li>Disable VPN or proxy if you're using one</li>
                <li>Check firewall settings aren't blocking Lightroom</li>
                <li>Restart Lightroom and try again</li>
                <li>Try uploading at a different time (avoid peak hours)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connection Errors */}
        <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-amber-100 border-b border-amber-200">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Cannot Connect to PikSend Server
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-amber-900">
              <strong>Symptoms:</strong> Error message "Cannot connect to server" or "Network error" when verifying connection.
            </p>
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verify your internet connection is working (try opening piksend.com in a browser)</li>
                <li>Check if PikSend is experiencing downtime (check status page)</li>
                <li>Disable antivirus or firewall temporarily to test</li>
                <li>Try using a different network (mobile hotspot, different WiFi)</li>
                <li>Check system date and time are correct</li>
                <li>Clear Lightroom's cache and restart</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Gallery Not Found */}
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-yellow-100 border-b border-yellow-200">
            <h4 className="font-bold text-yellow-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Gallery Not Found / Cannot Load Galleries
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-yellow-900">
              <strong>Symptoms:</strong> Gallery list is empty or shows "Gallery not found" error.
            </p>
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verify you have created at least one gallery in your PikSend account</li>
                <li>Click "Refresh Galleries" button in the plugin</li>
                <li>Check that the gallery wasn't deleted from the web dashboard</li>
                <li>Verify your API key has the correct permissions</li>
                <li>Try logging out and back in to the plugin</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plugin Not Loading */}
        <div className="border border-purple-200 bg-purple-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-purple-100 border-b border-purple-200">
            <h4 className="font-bold text-purple-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Plugin Not Loading / Not Visible in Lightroom
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-purple-900">
              <strong>Symptoms:</strong> PikSend doesn't appear in Plug-in Manager or menu items are missing.
            </p>
            <div className="text-sm text-purple-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verify the plugin folder is in the correct Modules directory</li>
                <li>Check that you copied the entire .lrplugin folder, not just contents</li>
                <li>Ensure Lightroom version is 11.0 or later</li>
                <li>Try reinstalling the plugin (delete and copy again)</li>
                <li>Check Lightroom's log file for error messages</li>
                <li>On macOS, grant Lightroom full disk access in System Preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Issues */}
        <div className="border border-blue-200 bg-blue-50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-blue-100 border-b border-blue-200">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <AlertCircle size={18} />
              Slow Upload Speed / Lightroom Freezing
            </h4>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-blue-900">
              <strong>Symptoms:</strong> Uploads are very slow or Lightroom becomes unresponsive during uploads.
            </p>
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-2">Solutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Reduce the number of photos uploaded at once</li>
                <li>Lower export quality settings (try 80% instead of 100%)</li>
                <li>Resize images to smaller dimensions (2048px instead of full size)</li>
                <li>Close other applications to free up system resources</li>
                <li>Check your internet upload speed (use speedtest.net)</li>
                <li>Pause other uploads or downloads on your network</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How to Check Logs */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <FileText size={20} className="text-slate-600" />
            How to Check Plugin Logs
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm">
            Plugin logs can help diagnose issues. Here's how to find and check them:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Windows</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <code className="text-xs text-slate-900 font-mono">
                  C:\Users\[YourUsername]\AppData\Roaming\Adobe\Lightroom\Modules\PikSend.lrplugin\PikSend.log
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">macOS</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <code className="text-xs text-slate-900 font-mono">
                  ~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin/PikSend.log
                </code>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-900">
                <strong>Tip:</strong> When contacting support, include the last 50-100 lines of the log file 
                to help us diagnose your issue faster.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-indigo-200">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-3">
            <Mail size={20} className="text-indigo-600" />
            Still Need Help?
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm">
            If you've tried the solutions above and still have issues, our support team is here to help.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <a 
              href="/contact"
              className="flex items-center gap-3 p-4 bg-white border border-indigo-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <MessageCircle size={20} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Contact Form</h4>
                <p className="text-xs text-slate-600">Send us a message</p>
              </div>
              <ExternalLink size={16} className="ml-auto text-slate-400" />
            </a>

            <a 
              href="mailto:support@piksend.com"
              className="flex items-center gap-3 p-4 bg-white border border-indigo-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Mail size={20} className="text-violet-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Email Support</h4>
                <p className="text-xs text-slate-600">support@piksend.com</p>
              </div>
              <ExternalLink size={16} className="ml-auto text-slate-400" />
            </a>
          </div>

          <div className="bg-white border border-indigo-200 rounded-lg p-4 text-sm">
            <p className="text-slate-700 mb-2">
              <strong>When contacting support, please include:</strong>
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Your PikSend account email</li>
              <li>Lightroom version number</li>
              <li>Operating system and version</li>
              <li>Plugin version number</li>
              <li>Description of the issue and steps to reproduce</li>
              <li>Relevant log file excerpts (if applicable)</li>
              <li>Screenshots of error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
