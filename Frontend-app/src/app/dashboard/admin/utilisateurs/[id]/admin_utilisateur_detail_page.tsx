'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShoppingBag,
  UserCheck,
  UserX,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  MODIFIED: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'En attente',
  CONFIRMED: 'Confirmee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  MODIFIED: 'Modifiee',
};

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminProfile {
  nom_marque?: string;
  telephone?: string;
  disponibilite?: boolean;
  adresse?: {
    ville?: string;
    quartier?: string;
  };
}

interface AdminOrder {
  _id: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface AdminUserDetailResponse {
  user: AdminUser;
  profile: AdminProfile | null;
  orders: AdminOrder[];
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api
      .get<AdminUserDetailResponse>(`/admin/users/${id}`)
      .then(({ data: response }) => setData(response))
      .catch(() => showToast('Erreur chargement', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const { data: response } = await api.patch<{ message: string; user: { status: string } }>(
        `/admin/users/${id}/toggle-status`
      );
      showToast(response.message, 'success');
      setData((prev) => (prev ? { ...prev, user: { ...prev.user, status: response.user.status } } : prev));
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message ?? 'Erreur', 'error');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="h-40 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-ardoise-light">Utilisateur introuvable</div>;
  }

  const { user, profile, orders } = data;

  return (
    <div className="text-ardoise">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ardoise-light transition-colors hover:text-ardoise"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            user.status === 'actif'
              ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
              : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {toggling ? (
            <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
          ) : user.status === 'actif' ? (
            <UserX className="h-4 w-4" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          {user.status === 'actif' ? 'Desactiver le compte' : 'Activer le compte'}
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-pierre bg-white p-6">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-pierre-light">
            <span className="text-2xl font-bold text-ardoise">{user.name?.charAt(0)?.toUpperCase()}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-ardoise">{user.name}</h1>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  user.role === 'admin'
                    ? 'border-purple-200 bg-purple-50 text-purple-700'
                    : user.role === 'couturier'
                      ? 'border-emeraude/20 bg-emeraude/10 text-emeraude'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
              >
                {user.role === 'admin' && <Shield className="mr-1 inline h-3 w-3" />}
                {user.role}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  user.status === 'actif' ? 'text-green-700' : 'text-red-600'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    user.status === 'actif' ? 'bg-green-600' : 'bg-red-500'
                  }`}
                />
                {user.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm text-ardoise-light">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-ardoise-light">
                <Calendar className="h-4 w-4" />
                Inscrit le{' '}
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {profile && (
              <div className="mt-3 flex flex-wrap gap-4">
                {(profile.nom_marque || profile.adresse?.ville || profile.adresse?.quartier) && (
                  <span className="flex items-center gap-1.5 text-sm text-ardoise-light">
                    <MapPin className="h-4 w-4" />
                    {[profile.nom_marque, profile.adresse?.quartier, profile.adresse?.ville]
                      .filter(Boolean)
                      .join(' - ')}
                  </span>
                )}
                {profile.telephone && (
                  <span className="flex items-center gap-1.5 text-sm text-ardoise-light">
                    <Phone className="h-4 w-4" />
                    {profile.telephone}
                  </span>
                )}
                {profile.disponibilite !== undefined && (
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      profile.disponibilite ? 'text-green-700' : 'text-amber-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        profile.disponibilite ? 'bg-green-600' : 'bg-amber-500'
                      }`}
                    />
                    {profile.disponibilite ? 'Disponible' : 'Occupe'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-pierre bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-ardoise">
          <ShoppingBag className="h-4 w-4 text-amber-600" />
          Historique des commandes ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ardoise-light">Aucune commande associee</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between border-b border-pierre-light py-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ardoise">{order.description ?? 'Commande'}</p>
                  <p className="text-xs text-ardoise-light">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
