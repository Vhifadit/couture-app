'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { Scissors, Search, MapPin, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Couturier {
  _id: string;
  name: string;
  email: string;
  status: string;
  location?: string;
  availability?: boolean;
  photos?: string[];
  specialties?: string[];
  createdAt: string;
}

export default function AdminCouturiersPage() {
  const { showToast } = useToast();
  const [couturiers, setCouturiers] = useState<Couturier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchCouturiers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');
      const { data } = await api.get(`/admin/couturiers?${params}`);
      setCouturiers(data.couturiers);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page, showToast]);

  useEffect(() => { fetchCouturiers(); }, [fetchCouturiers]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="text-ardoise">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ardoise flex items-center gap-3">
          <Scissors className="w-6 h-6 text-emeraude" />
          Couturiers
        </h1>
        <p className="text-ardoise-light mt-1">{total} couturier{total > 1 ? 's' : ''} inscrits</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ardoise-light" />
          <input
            type="text"
            placeholder="Rechercher un couturier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise placeholder-ardoise-light focus:outline-none focus:border-emeraude transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : couturiers.length === 0 ? (
          <div className="col-span-full bg-white border border-pierre rounded-xl p-12 text-center">
            <Scissors className="w-10 h-10 text-ardoise-light mx-auto mb-3" />
            <p className="text-ardoise-light">Aucun couturier trouvé</p>
          </div>
        ) : (
          couturiers.map(c => (
            <div key={c._id} className="bg-white border border-pierre rounded-xl p-5 hover:border-pierre-dark transition-colors shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emeraude/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emeraude">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ardoise truncate">{c.name}</p>
                    <span className={`flex-shrink-0 text-xs font-medium ${
                      c.availability ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      ● {c.availability ? 'Dispo' : 'Occupé'}
                    </span>
                  </div>
                  <p className="text-xs text-ardoise-light truncate">{c.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-ardoise-light mb-4">
                {c.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {c.location}
                  </span>
                )}
                <span className={`ml-auto px-2 py-0.5 rounded-full border font-medium ${
                  c.status === 'actif'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {c.status}
                </span>
              </div>

              <Link
                href={`/dashboard/admin/utilisateurs/${c._id}`}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-pierre text-sm text-ardoise-light hover:text-ardoise hover:border-pierre-dark hover:bg-pierre-light transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Voir le profil
              </Link>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-ardoise-light">Page {page} sur {pages}</p>
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
  );
}

