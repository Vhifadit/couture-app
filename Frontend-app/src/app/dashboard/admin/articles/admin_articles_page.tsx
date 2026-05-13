'use client';

import { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import { normalizePhotoUrl } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import {
  Newspaper, Search, CheckCircle, XCircle, Trash2,
  ChevronLeft, ChevronRight, Image as ImageIcon,
} from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  photos: string[];
  createdAt: string;
  couturier?: { name: string; email: string };
}

interface ModerateArticleResponse {
  message: string;
  article: {
    _id: string;
    status: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  brouillon: { label: 'Brouillon',  classes: 'bg-gray-100 text-gray-700' },
  publie:    { label: 'Publié',     classes: 'bg-green-100 text-green-700' },
  rejete:    { label: 'Rejeté',     classes: 'bg-red-100 text-red-700' },
};

export default function AdminArticlesPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', String(page));
      const { data } = await api.get(`/admin/articles?${params}`);
      setArticles(data.articles);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, showToast]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [search, status]);

  const moderate = async (id: string, action: 'approve' | 'reject' | 'delete'): Promise<void> => {
    setActing(`${id}-${action}`);
    try {
      const { data } = await api.patch<ModerateArticleResponse>(`/admin/articles/${id}/moderate`, { action });
      showToast(data.message, 'success');
      if (action === 'delete') {
        setArticles(prev => prev.filter(a => a._id !== id));
        setTotal(t => t - 1);
      } else {
        setArticles(prev =>
          prev.map(a => a._id === id ? { ...a, status: data.article.status } : a)
        );
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message ?? 'Erreur', 'error');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="text-ardoise">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ardoise flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-blue-600" />
          Modération des articles
        </h1>
        <p className="text-ardoise-light mt-1">{total} article{total > 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ardoise-light" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise placeholder-ardoise-light focus:outline-none focus:border-emeraude transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="px-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise focus:outline-none focus:border-emeraude transition-colors appearance-none cursor-pointer"
        >
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="publie">Publié</option>
          <option value="rejete">Rejeté</option>
        </select>
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white border border-pierre rounded-xl p-12 text-center">
          <Newspaper className="w-10 h-10 text-ardoise-light mx-auto mb-3" />
          <p className="text-ardoise-light">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => {
            const statusCfg = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.brouillon;
            return (
              <div
                key={article._id}
                className="bg-white border border-pierre rounded-xl p-5 hover:border-pierre-dark transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-pierre-light flex items-center justify-center shrink-0 overflow-hidden">
                    {article.photos?.[0] ? (
                      <img
                        src={normalizePhotoUrl(article.photos[0])}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-ardoise-light" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-ardoise truncate">{article.title || 'Sans titre'}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-ardoise-light line-clamp-2 mb-2">
                      {article.description || 'Pas de description'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-ardoise-light">
                      <span>Par <span className="text-ardoise">{article.couturier?.name ?? 'Inconnu'}</span></span>
                      {article.category && <span>· {article.category}</span>}
                      <span>· {new Date(article.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {article.status !== 'publie' && (
                      <button
                        onClick={() => moderate(article._id, 'approve')}
                        disabled={!!acting}
                        aria-label="Approuver l'article"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-all disabled:opacity-50"
                      >
                        {acting === `${article._id}-approve` ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Approuver
                      </button>
                    )}
                    {article.status !== 'rejete' && (
                      <button
                        onClick={() => moderate(article._id, 'reject')}
                        disabled={!!acting}
                        aria-label="Rejeter l'article"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-all disabled:opacity-50"
                      >
                        {acting === `${article._id}-reject` ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Rejeter
                      </button>
                    )}
                      <button
                        onClick={() => {
                          if (confirm('Supprimer définitivement cet article ?')) {
                            moderate(article._id, 'delete');
                          }
                        }}
                        disabled={!!acting}
                        aria-label="Supprimer l'article"
                        className="p-1.5 text-ardoise-light hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Supprimer"
                      >
                      {acting === `${article._id}-delete` ? (
                        <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-ardoise-light">Page {page} sur {pages}</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

