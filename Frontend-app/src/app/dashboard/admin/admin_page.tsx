'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Users, ShoppingBag, Newspaper, Scissors,
  TrendingUp, Clock, CheckCircle, XCircle,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalCouturiers: number;
  totalClients: number;
  totalOrders: number;
  totalArticles: number;
  pendingOrders: number;
  activeUsers: number;
}

interface RecentOrder {
  _id: string;
  status: string;
  createdAt: string;
  client?: { name: string; email: string };
  couturier?: { name: string };
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  debut:    'bg-yellow-100 text-yellow-700',
  en_cours: 'bg-amber-100 text-amber-700',
  termine:  'bg-green-100 text-green-700',
  annule:   'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  debut:    'Début',
  en_cours: 'En cours',
  termine:  'Terminé',
  annule:   'Annulé',
};

const ROLE_COLORS: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-700',
  couturier: 'bg-emeraude/10 text-emeraude',
  client:    'bg-blue-100 text-blue-700',
};

function StatCard({
  icon: Icon, label, value, sub, color, href,
}: {
  icon: React.ElementType; label: string; value: number; sub?: string;
  color: string; href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden h-full">
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-[#2D6A4F] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
        </div>
        <div className="relative z-10">
          <p className="text-3xl font-black text-[#2D6A4F] mb-1 tracking-tight">{value.toLocaleString()}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
          {sub && (
            <div className="mt-4 inline-flex px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{sub}</span>
            </div>
          )}
        </div>
        {/* Decorative element */}
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${color.split(' ')[0]}`}></div>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setRecentUsers(data.recentUsers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-10">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded-2xl w-64" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-[2rem]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Panel Administrateur
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Vue d&apos;ensemble de la plateforme
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Système Online</span>
          </div>
        </div>
      </div>

      {/* Stats grid Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats?.totalUsers ?? 0}
          sub={`${stats?.activeUsers ?? 0} actifs`}
          color="bg-purple-50 text-purple-600"
          href="/dashboard/admin/utilisateurs"
        />
        <StatCard
          icon={Scissors}
          label="Couturiers"
          value={stats?.totalCouturiers ?? 0}
          sub="Partenaires inscrits"
          color="bg-green-50 text-green-600"
          href="/dashboard/admin/couturiers"
        />
        <StatCard
          icon={ShoppingBag}
          label="Commandes"
          value={stats?.totalOrders ?? 0}
          sub={`${stats?.pendingOrders ?? 0} en attente`}
          color="bg-amber-50 text-amber-600"
          href="/dashboard/admin/commandes"
        />
        <StatCard
          icon={Newspaper}
          label="Articles"
          value={stats?.totalArticles ?? 0}
          sub="Blog & Actualités"
          color="bg-blue-50 text-blue-600"
          href="/dashboard/admin/articles"
        />
      </div>

      {/* Recent activity Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Commandes Récentes</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Dernières transactions</p>
            </div>
            <Link href="/dashboard/admin/commandes" className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:underline">
              Gérer →
            </Link>
          </div>

          <div className="px-4 py-2">
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Aucune commande</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors rounded-2xl group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#2D6A4F] text-xs font-black">
                        #{order._id.slice(-3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-700 truncate">
                          {order.client?.name ?? 'Client inconnu'}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
                          Pour {order.couturier?.name ?? 'Couturier inconnu'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <span className="text-[10px] font-bold text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Nouveaux Comptes</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inscriptions récentes</p>
            </div>
            <Link href="/dashboard/admin/utilisateurs" className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:underline">
              Voir tout →
            </Link>
          </div>

          <div className="px-4 py-2">
            {recentUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Aucun utilisateur</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors rounded-2xl group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-[#2D6A4F]">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-700 truncate">{u.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-wider truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-3">
                      <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                      <div className="flex items-center gap-2">
                        {u.status === 'actif' ? (
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
