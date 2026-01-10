"use client";

import Link from "next/link";
import { User, HardDrive, Image } from "lucide-react";
import type { TopUserData } from "@/types/admin";

interface TopUsersTableProps {
  users: TopUserData[];
  title?: string;
  subtitle?: string;
}

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * Top Users Table Component
 * 
 * Displays the most active users by gallery count and storage usage.
 * Requirements: 5.4
 */
export function TopUsersTable({
  users,
  title = "Utilisateurs les plus actifs",
  subtitle = "Par nombre de galeries et stockage utilisé",
}: TopUsersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Table */}
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user, index) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              {/* Rank */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? "bg-amber-100 text-amber-700"
                    : index === 1
                    ? "bg-slate-200 text-slate-700"
                    : index === 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {user.name || "Sans nom"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Image className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{user.gallery_count}</span>
                  <span className="text-slate-400 text-xs">galeries</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <HardDrive className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">
                    {formatStorage(user.storage_used_mb)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-slate-400">
          Aucun utilisateur trouvé pour cette période
        </div>
      )}
    </div>
  );
}
