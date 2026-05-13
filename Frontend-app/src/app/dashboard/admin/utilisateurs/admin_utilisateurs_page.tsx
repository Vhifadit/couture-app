'use client';

import { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import {
  Search, Filter, UserCheck, UserX, Eye,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ToggleUserResponse {
  message: string;
  user: {
    _id: string;
    status: string;
  };
}

const ROLE_COLORS: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-700',
  couturier: 'bg-emeraude/10 text-emeraude',
  client:    'bg-blue-100 text-blue-700',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', couturier: 'Couturier', client: 'Client',
};

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      if (status) params.set('status', status);
      params.set('page', String(page));

      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, role, status]);

  const handleToggle = async (userId: string) => {
    setToggling(userId);
    try {
      const { data } = await api.patch<ToggleUserResponse>(`/admin/users/${userId}/toggle-status`);
      showToast(data.message, 'success');
      setUsers(prev =>
        prev.map(u => u._id === userId ? { ...u, status: data.user.status } : u)
      );
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message ?? 'Erreur', 'error');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="text-ardoise">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ardoise flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          Utilisateurs
        </h1>
        <p className="text-ardoise-light mt-1">{total} compte{total > 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ardoise-light" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise placeholder-ardoise-light focus:outline-none focus:border-emeraude transition-colors"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ardoise-light pointer-events-none" />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          aria-label="Filtrer par rôle"
          className="pl-9 pr-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise focus:outline-none focus:border-emeraude transition-colors appearance-none cursor-pointer"
        >
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="couturier">Couturier</option>
            <option value="client">Client</option>
          </select>
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="px-4 py-2 bg-white border border-pierre rounded-lg text-sm text-ardoise focus:outline-none focus:border-emeraude transition-colors appearance-none cursor-pointer"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-pierre rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pierre-light">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Rôle</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Statut</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Inscrit le</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-ardoise-light uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pierre-light">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-3">
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-ardoise-light py-12 text-sm">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="hover:bg-pierre-light/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pierre-light flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-ardoise">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ardoise">{user.name}</p>
                        <p className="text-xs text-ardoise-light">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === 'actif' ? 'text-green-700' : 'text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'actif' ? 'bg-green-600' : 'bg-red-500'}`} />
                      {user.status === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ardoise-light">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/admin/utilisateurs/${user._id}`}
                        className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg transition-all"
                        title="Voir le profil"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleToggle(user._id)}
                        disabled={toggling === user._id}
                        className={`p-1.5 rounded-lg transition-all ${
                          user.status === 'actif'
                            ? 'text-ardoise-light hover:text-red-600 hover:bg-red-50'
                            : 'text-ardoise-light hover:text-emeraude hover:bg-emeraude/10'
                        }`}
                        title={user.status === 'actif' ? 'Désactiver' : 'Activer'}
                      >
                        {toggling === user._id ? (
                          <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                        ) : user.status === 'actif' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-pierre-light">
            <p className="text-xs text-ardoise-light">
              Page {page} sur {pages} — {total} résultat{total > 1 ? 's' : ''}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Page précédente"
                className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                aria-label="Page suivante"
                className="p-1.5 text-ardoise-light hover:text-ardoise hover:bg-pierre-light rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

