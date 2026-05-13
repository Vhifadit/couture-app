'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  ShoppingBag, ChevronLeft, ChevronRight, User, Scissors, Eye,
} from 'lucide-react';

interface Order {
  _id: string;
  notes?: string;
  service_type?: string;
  status: string;
  deliveryMode?: string;
  createdAt: string;
  client?: { name: string; email: string };
  couturier?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PLANNED: { label: 'En attente', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmee', classes: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En cours', classes: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Terminee', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulee', classes: 'bg-red-100 text-red-700' },
  MODIFIED: { label: 'Modifiee', classes: 'bg-purple-100 text-purple-700' },
};

export default function AdminCommandesPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', String(page));
      const { data } = await api.get(`/admin/orders?${params}`);
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, page, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="text-ardoise">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ardoise flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-amber-600" />
          Supervision des commandes
        </h1>
        <p className="text-ardoise-light mt-1">{total} commande{total > 1 ? 's' : ''}</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: '',         label: 'Toutes' },
          { value: 'PLANNED', label: 'En attente' },
          { value: 'CONFIRMED', label: 'Confirmees' },
          { value: 'IN_PROGRESS', label: 'En cours' },
          { value: 'COMPLETED', label: 'Terminees' },
          { value: 'CANCELLED', label: 'Annulees' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              status === opt.value
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white border border-pierre text-ardoise-light hover:text-ardoise hover:border-pierre-dark'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-pierre rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pierre-light">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Commande</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Client</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Couturier</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Livraison</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Statut</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pierre-light">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-3">
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-ardoise-light py-12 text-sm">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PLANNED;
                return (
                  <tr key={order._id} className="hover:bg-pierre-light/40 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-ardoise font-mono">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-ardoise-light shrink-0" />
                        <span className="text-sm text-ardoise">{order.client?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-ardoise-light shrink-0" />
                        <span className="text-sm text-ardoise">{order.couturier?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-ardoise-light">
                        {order.deliveryMode === 'LIVRAISON'
                          ? 'Livraison'
                          : order.deliveryMode === 'RETRAIT_ATELIER'
                            ? 'Retrait'
                            : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        aria-label="Voir les details de la commande"
                        className="p-2 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg transition-all"
                        title={order.notes || order.service_type || 'Commande'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ardoise-light">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-pierre-light">
            <p className="text-xs text-ardoise-light">Page {page} sur {pages} — {total} résultat{total > 1 ? 's' : ''}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                aria-label="Page précédente"
                className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                aria-label="Page suivante"
                className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
