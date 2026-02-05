'use client';

import { useState } from 'react';
import { Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface VersionInfoProps {
  version: string;
  fileSize: number;
  releaseDate: string;
  changelog: string;
}

export function VersionInfo({ version, fileSize, releaseDate, changelog }: VersionInfoProps) {
  const [isChangelogExpanded, setIsChangelogExpanded] = useState(false);

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format release date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Latest Version</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Version Number */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Package size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Version</p>
            <p className="text-2xl font-bold text-slate-900">{version}</p>
          </div>
        </div>

        {/* File Size and Release Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">File Size</p>
            <p className="text-lg font-semibold text-slate-900">{formatFileSize(fileSize)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
              <Calendar size={16} />
              Release Date
            </p>
            <p className="text-lg font-semibold text-slate-900">{formatDate(releaseDate)}</p>
          </div>
        </div>

        {/* Changelog */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsChangelogExpanded(!isChangelogExpanded)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
          >
            <span className="font-semibold text-slate-900">What's New</span>
            {isChangelogExpanded ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}
          </button>
          
          {isChangelogExpanded && (
            <div className="px-4 py-3 bg-white border-t border-slate-200">
              <div className="prose prose-sm max-w-none text-slate-600">
                {changelog.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
