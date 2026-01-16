'use client';

/**
 * Sales Table Component
 * Displays paginated list of sales with filtering
 * 
 * @module components/revenue/sales-table
 * Requirements: 5.3 - UI - Revenue Dashboard Page
 * Requirements: 7.1 - Refund Management (Refund action button)
 */
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, ChevronLeft, ChevronRight, Receipt, ChevronDown, ExternalLink, RotateCcw } from 'lucide-react';
import { RefundModal, Sale } from './refund-modal';

interface SalesResponse {
  sales: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'succeeded':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 font-bold text-[10px] uppercase tracking-wider">
          Complété
        </Badge>
      );
    case 'refunded':
      return (
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0 font-bold text-[10px] uppercase tracking-wider">
          Remboursé
        </Badge>
      );
    case 'disputed':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 font-bold text-[10px] uppercase tracking-wider">
          Litige
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-0 font-bold text-[10px] uppercase tracking-wider">
          {status}
        </Badge>
      );
  }
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-6">
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SalesTable() {
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      const response = await fetch(`/api/photographer/sales?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('format', 'csv');

      const response = await fetch(`/api/photographer/sales/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventes-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export sales:', error);
    }
  };

  const handleRefundClick = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundModalOpen(true);
  };

  const handleRefundSuccess = () => {
    // Refresh the sales list after a successful refund
    fetchSales();
  };

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
          <Receipt size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Historique des ventes</h2>
          <p className="text-xs text-slate-500">
            {data?.total || 0} ventes au total
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="">Tous les statuts</option>
              <option value="succeeded">Complété</option>
              <option value="refunded">Remboursé</option>
              <option value="disputed">Litige</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Galerie
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Acheteur
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Net
                </th>
                <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Aucune vente trouvée</p>
                    <p className="text-slate-400 text-sm">Les ventes apparaîtront ici</p>
                  </td>
                </tr>
              ) : (
                data?.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {sale.galleryTitle}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600 text-sm">{sale.buyerEmail}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(sale.amount, sale.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(sale.netAmount, sale.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-slate-500 text-sm">
                        {formatDate(sale.purchasedAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {sale.status === 'succeeded' && (
                        <button
                          onClick={() => handleRefundClick(sale)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Rembourser cette vente"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rembourser
                        </button>
                      )}
                      {sale.status === 'refunded' && (
                        <span className="text-slate-400 text-xs font-medium">—</span>
                      )}
                      {sale.status === 'disputed' && (
                        <span className="text-amber-600 text-xs font-medium">En litige</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Affichage {((page - 1) * data.limit) + 1} à {Math.min(page * data.limit, data.total)} sur {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(data.totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        page === pageNum
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        sale={selectedSale}
        onRefundSuccess={handleRefundSuccess}
      />
    </div>
  );
}
