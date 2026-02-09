/**
 * Data Privacy Settings Component
 * RGPD-compliant data management
 * 
 * @module components/settings/data-privacy
 * Requirements: 23.5, 23.6 - Data export and account deletion
 */

'use client';

import { useState } from 'react';
import { Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export function DataPrivacy() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const response = await fetch('/api/user/export');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `piksend-data-${Date.now()}.json`
        : `piksend-data-${Date.now()}.json`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      alert('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Redirect to homepage after successful deletion
      window.location.href = '/?deleted=true';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Exporter mes données
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Téléchargez une copie de toutes vos données (profil, galeries, images, analytics) au format JSON. 
              Conformément au RGPD, vous avez le droit d&apos;accéder à vos données personnelles.
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter mes données
                </>
              )}
            </button>
            {exportSuccess && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                Données exportées avec succès !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Supprimer mon compte
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible. 
              Toutes vos galeries, images et données seront définitivement supprimées.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-bold mb-1">Attention : Cette action est irréversible</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Toutes vos galeries seront supprimées</li>
                        <li>Toutes vos images seront supprimées</li>
                        <li>Votre abonnement sera annulé</li>
                        <li>Toutes vos données seront définitivement effacées</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer :
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer définitivement
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
