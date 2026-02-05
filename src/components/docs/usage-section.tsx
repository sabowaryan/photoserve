'use client';

import { Key, CheckCircle, Upload, FolderPlus, Settings, Image as ImageIcon } from 'lucide-react';

export function UsageSection() {
  return (
    <div className="space-y-8">
      <p className="text-slate-600 leading-relaxed">
        Once installed, follow these steps to configure and use the PikSend Lightroom plugin to upload 
        photos directly to your galleries.
      </p>

      {/* Configuration Steps */}
      <div className="space-y-6">
        {/* Step 1: Generate API Key */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <Key size={20} className="text-indigo-600" />
              Step 1: Generate an API Key
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              The plugin uses API keys to securely authenticate with your PikSend account. You'll need to 
              generate an API key from your dashboard.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  1
                </div>
                <p className="text-slate-600 text-sm">
                  Log in to your PikSend account and navigate to <strong>Settings → API Keys</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  2
                </div>
                <p className="text-slate-600 text-sm">
                  Click the <strong>"Create API Key"</strong> button
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  3
                </div>
                <p className="text-slate-600 text-sm">
                  Give your key a descriptive name (e.g., "Lightroom Plugin") and optionally set an expiration date
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  4
                </div>
                <p className="text-slate-600 text-sm">
                  Click <strong>"Create"</strong> and copy the generated API key immediately
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="text-amber-900 font-bold mb-1">⚠️ Important</p>
              <p className="text-amber-800">
                The API key will only be shown once. Make sure to copy it before closing the dialog. 
                If you lose it, you'll need to create a new one.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-900">
                <strong>Quick Link:</strong> <a href="/settings/api-keys" className="text-indigo-600 hover:underline">Go to API Keys page</a>
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Configure Plugin */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <Settings size={20} className="text-violet-600" />
              Step 2: Enter API Key in Lightroom
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              Configure the plugin with your API key to establish the connection between Lightroom and PikSend.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs">
                  1
                </div>
                <p className="text-slate-600 text-sm">
                  In Lightroom, go to <strong>File → Plug-in Manager</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs">
                  2
                </div>
                <p className="text-slate-600 text-sm">
                  Select <strong>"PikSend"</strong> from the list of plugins
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs">
                  3
                </div>
                <p className="text-slate-600 text-sm">
                  In the plugin settings panel, paste your API key into the <strong>"API Key"</strong> field
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs">
                  4
                </div>
                <p className="text-slate-600 text-sm">
                  Click <strong>"Verify Connection"</strong> to test the API key
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="text-green-900 flex items-center gap-2">
                <CheckCircle size={16} />
                <strong>Success!</strong> If the connection is verified, you'll see a confirmation message with your account details.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Create Gallery */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <FolderPlus size={20} className="text-purple-600" />
              Step 3: Create a Gallery from Lightroom
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              Create a new PikSend gallery directly from Lightroom to organize your photos.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                  1
                </div>
                <p className="text-slate-600 text-sm">
                  In the Library module, go to <strong>File → Plug-in Extras → PikSend → Create Gallery</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                  2
                </div>
                <p className="text-slate-600 text-sm">
                  Enter a gallery name and optional description
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                  3
                </div>
                <p className="text-slate-600 text-sm">
                  Configure gallery settings (password protection, expiration, download options, etc.)
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                  4
                </div>
                <p className="text-slate-600 text-sm">
                  Click <strong>"Create Gallery"</strong> to create it on PikSend
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
              <p className="text-slate-700">
                <strong>Tip:</strong> You can also use existing galleries from your PikSend account. 
                The plugin will show a list of your galleries when uploading photos.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Upload Photos */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <Upload size={20} className="text-emerald-600" />
              Step 4: Upload Photos
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              Select and upload photos from your Lightroom catalog to your PikSend galleries.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  1
                </div>
                <p className="text-slate-600 text-sm">
                  In the Library module, select the photos you want to upload
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  2
                </div>
                <p className="text-slate-600 text-sm">
                  Go to <strong>File → Plug-in Extras → PikSend → Upload to Gallery</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  3
                </div>
                <p className="text-slate-600 text-sm">
                  Select the destination gallery from the dropdown list
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  4
                </div>
                <p className="text-slate-600 text-sm">
                  Choose export settings (quality, format, watermark, etc.)
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  5
                </div>
                <p className="text-slate-600 text-sm">
                  Click <strong>"Upload"</strong> to start the upload process
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-900">
                <strong>Progress Tracking:</strong> The plugin will show upload progress for each photo. 
                You can continue working in Lightroom while uploads are in progress.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5: Manage Gallery Settings */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <ImageIcon size={20} className="text-orange-600" />
              Step 5: Manage Gallery Settings
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              You can manage gallery settings either from Lightroom or from the PikSend web dashboard.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-2">From Lightroom</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Update gallery name and description</li>
                  <li>• Change password protection</li>
                  <li>• Set expiration dates</li>
                  <li>• Configure download options</li>
                  <li>• Enable/disable comments</li>
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-2">From Web Dashboard</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• All Lightroom settings plus:</li>
                  <li>• Custom branding and themes</li>
                  <li>• Advanced sharing options</li>
                  <li>• Analytics and statistics</li>
                  <li>• Client proofing features</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
              <p className="text-slate-700">
                <strong>Access your galleries:</strong> Visit <a href="/dashboard" className="text-indigo-600 hover:underline">your dashboard</a> to 
                manage all your galleries and view detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-3">
          <CheckCircle size={20} />
          Best Practices
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-indigo-900 text-sm mb-2">Export Settings</h4>
            <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
              <li>Use JPEG format for web galleries</li>
              <li>Set quality to 80-90% for optimal balance</li>
              <li>Resize images to 2048px on long edge</li>
              <li>Apply sharpening for screen display</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-sm mb-2">Organization</h4>
            <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
              <li>Create separate galleries for each client/project</li>
              <li>Use descriptive gallery names</li>
              <li>Set expiration dates for time-sensitive galleries</li>
              <li>Enable password protection for client galleries</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-sm mb-2">Performance</h4>
            <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
              <li>Upload in batches of 50-100 photos</li>
              <li>Use a stable internet connection</li>
              <li>Avoid uploading during peak hours</li>
              <li>Keep Lightroom open during uploads</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-sm mb-2">Security</h4>
            <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
              <li>Keep your API key secure and private</li>
              <li>Set expiration dates on API keys</li>
              <li>Revoke unused API keys</li>
              <li>Use password protection for sensitive galleries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
