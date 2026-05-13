"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, MessageSquare, Star, Clock, ArrowRight, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Order, orderApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    commandesEnCours: 0,
    totalDepense: 0,
    messagesNonLus: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await orderApi.getAll();
        const orders = ordersResponse.orders || [];
        
        const enCours = orders.filter((o: Order) => 
          ['PLANNED', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status)
        ).length;

        setCommandes(orders.slice(0, 5));
        
        setStats({
          commandesEnCours: enCours,
          totalDepense: 0, 
          messagesNonLus: 0
        });
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatutDisplay = (status: string): string => {
    switch (status) {
      case 'PLANNED': return "En attente";
      case 'CONFIRMED': return "Confirmé";
      case 'IN_PROGRESS': return "En cours";
      case 'COMPLETED': return "Terminé";
      case 'CANCELLED': return "Annulé";
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'RETOUCHE': return "Retouche";
      case 'CREATION_SUR_MESURE': return "Création sur mesure";
      case 'CONFECTION': return "Confection";
      case 'AUTRE': return "Autre";
      default: return service;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D6A4F]" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Préparation de votre espace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Mon Espace Client
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Bienvenue, {user?.name || 'Client'}
            </p>
          </div>
        </div>
        
        <Link href="/couturiers">
          <button className="bg-[#2D6A4F] text-white rounded-2xl px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-[#1B4332] transition-all shadow-2xl shadow-[#2D6A4F]/20 hover:scale-105 active:scale-95">
            Nouveau Projet
          </button>
        </Link>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-blue-50 text-blue-500 shadow-inner">
              <Package size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">En cours</p>
              <p className="text-4xl font-black text-[#2D6A4F] tracking-tight">{stats.commandesEnCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-yellow-50 text-yellow-600 shadow-inner">
              <Star size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Projets</p>
              <p className="text-4xl font-black text-[#2D6A4F] tracking-tight">{commandes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-green-50 text-green-500 shadow-inner">
              <MessageSquare size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Messages</p>
              <p className="text-4xl font-black text-[#2D6A4F] tracking-tight">{stats.messagesNonLus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Premium */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-10 py-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
          <div>
            <h2 className="text-2xl font-black text-[#2D6A4F] tracking-tight uppercase">Commandes Récentes</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vos derniers échanges avec nos artisans</p>
          </div>
          <Link href="/dashboard/client/commandes" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:gap-5 transition-all">
            Historique Complet <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {commandes.length === 0 ? (
            <div className="p-32 text-center flex flex-col items-center gap-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
                <Package size={48} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Aucune commande active</p>
                <p className="text-xs text-gray-300 font-medium max-w-xs mx-auto">Trouvez le tailleur parfait pour donner vie à vos projets !</p>
              </div>
              <Link href="/couturiers">
                <button className="px-10 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/20 hover:scale-105 transition-all">
                  Parcourir les couturiers
                </button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/30">
                  {["Référence", "Prestation", "Artisan", "Date de RDV", "Statut"].map((h) => (
                    <th key={h} className="text-[10px] font-black uppercase tracking-[0.25em] text-left px-12 py-8 text-gray-400 border-b border-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commandes.map((c, i: number) => (
                  <tr key={c._id || i} className="hover:bg-[#F5EFE6]/30 transition-all duration-300 group cursor-pointer">
                    <td className="px-12 py-8">
                      <span className="text-xs font-black text-[#2D6A4F] tracking-tighter group-hover:underline">#{c._id?.slice(-6).toUpperCase() || 'N/A'}</span>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{getServiceLabel(c.service_type)}</span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Sur-mesure</span>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-xs font-black transition-transform group-hover:rotate-6 shadow-sm">
                          {typeof c.couturier_id === 'object' ? c.couturier_id?.name?.charAt(0) : 'C'}
                        </div>
                        <span className="text-xs font-black text-gray-600 uppercase tracking-tight">{typeof c.couturier_id === 'object' ? c.couturier_id?.name : 'Couturier'}</span>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#2D6A4F]">
                           <Clock size={16} />
                        </div>
                        {formatDate(c.date_rendez_vous || c.createdAt || "")}
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className="inline-flex">
                        <Badge status={getStatutDisplay(c.status)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
