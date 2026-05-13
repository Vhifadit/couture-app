"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, MessageSquare, ShoppingBag, Star, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { couturierApi, orderApi, Order, CouturierProfile } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const statusLabel = (status: string) => {
  switch (status) {
    case "PLANNED": return "En attente";
    case "CONFIRMED": return "Acceptee";
    case "IN_PROGRESS": return "En cours";
    case "READY": return "Prete";
    case "DELIVERED": return "Livree";
    case "COMPLETED": return "Terminee";
    case "CANCELLED": return "Annulee";
    case "LATE": return "En retard";
    default: return status;
  }
};

export default function CouturierDashboardPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [profil, setProfil] = useState<CouturierProfile | null>(null);
  const [stats, setStats] = useState({
    commandesActives: 0,
    commandesRetard: 0,
    commandesTerminees: 0,
    messagesNonLus: 0,
    noteMoyenne: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: 'DISPONIBLE' | 'OCCUPE' | 'ABSENT') => {
    if (!profil) return;
    try {
      setIsUpdatingStatus(true);
      await couturierApi.setAvailabilityStatus(newStatus);
      setProfil({ ...profil, disponibilite_statut: newStatus, disponibilite: newStatus === 'DISPONIBLE' });
      // Déclencher une mise à jour globale des avatars si nécessaire
      window.dispatchEvent(new CustomEvent('profileUpdate'));
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      alert("Impossible de mettre à jour le statut.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, dashboardResponse] = await Promise.all([
          orderApi.getAll(),
          couturierApi.getDashboard().catch(() => null),
        ]);
        const orders = ordersResponse.orders || [];
        const profilData = dashboardResponse?.couturier || null;

        setCommandes(orders.slice(0, 5));
        setProfil(profilData);
        setStats({
          commandesActives:
            (dashboardResponse as { stats?: { commandes_en_cours?: number } } | null)?.stats?.commandes_en_cours ??
            orders.filter((o) => ["CONFIRMED", "IN_PROGRESS", "READY", "LATE"].includes(o.status)).length,
          commandesRetard: dashboardResponse?.stats.commandes_en_retard ?? orders.filter((o) => o.status === "LATE" || o.is_late).length,
          commandesTerminees: dashboardResponse?.stats.commandes_terminees ?? orders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status)).length,
          messagesNonLus: dashboardResponse?.stats.messages_non_lus ?? 0,
          noteMoyenne: profilData?.stats?.note_moyenne || 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const refreshIfNeeded = () => {
      // Quand on revient sur la page après création, le dashboard doit être rechargé.
      setIsLoading(true);
      fetchData();
    };

    fetchData();

    // Recharger quand l'utilisateur revient sur l'onglet / la page (cas courant après POST).
    window.addEventListener('focus', refreshIfNeeded);
    return () => {
      window.removeEventListener('focus', refreshIfNeeded);
    };
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#2D6A4F]" /></div>;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Espace Créateur
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Bienvenue, {profil?.nom_marque || user?.name || "Couturier"}
            </p>
          </div>
        </div>

        {profil && (
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20 flex items-center gap-1">
            <div className="px-4 py-2 hidden lg:block">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut actuel</span>
            </div>
            <div className="relative">
              <select
                aria-label="Statut de disponibilite"
                title="Statut de disponibilite"
                value={profil.disponibilite_statut || (profil.disponibilite ? 'DISPONIBLE' : 'ABSENT')}
                onChange={(e) => handleStatusChange(e.target.value as 'DISPONIBLE' | 'OCCUPE' | 'ABSENT')}
                disabled={isUpdatingStatus}
                className={`text-[10px] font-black uppercase tracking-widest py-3 pl-4 pr-10 rounded-xl border-none focus:ring-0 cursor-pointer appearance-none transition-all ${
                  profil.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-50 text-green-600' : 
                  profil.disponibilite_statut === 'OCCUPE' ? 'bg-orange-50 text-orange-600' : 
                  'bg-red-50 text-red-600'
                }`}
              >
                <option value="DISPONIBLE">Disponible</option>
                <option value="OCCUPE">Occupé</option>
                <option value="ABSENT">Absent</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {isUpdatingStatus ? (
                  <Loader2 size={14} className="animate-spin text-[#2D6A4F]" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${
                    profil.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-500' : 
                    profil.disponibilite_statut === 'OCCUPE' ? 'bg-orange-500' : 
                    'bg-red-500'
                  }`} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!profil && (
        <div className="rounded-[2rem] border border-yellow-200 bg-yellow-50 p-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-yellow-800 uppercase tracking-widest">Profil incomplet</p>
              <p className="text-xs text-yellow-700 font-medium">Configurez votre atelier pour recevoir des commandes.</p>
            </div>
          </div>
          <Link href="/dashboard/couturier/settings" className="px-6 py-3 bg-yellow-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-600/20">
            Créer mon profil
          </Link>
        </div>
      )}

      {/* Stats Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 text-green-500 mb-4 shadow-inner">
              <ShoppingBag size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Actives</p>
            <p className="text-3xl font-black text-[#2D6A4F]">{stats.commandesActives}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-red-500 mb-4 shadow-inner">
              <AlertTriangle size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">En retard</p>
            <p className="text-3xl font-black text-red-500">{stats.commandesRetard}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 mb-4 shadow-inner">
              <MessageSquare size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Messages</p>
            <p className="text-3xl font-black text-[#2D6A4F]">{stats.messagesNonLus}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-600 mb-4 shadow-inner">
              <Star size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Note globale</p>
            <p className="text-3xl font-black text-[#2D6A4F]">{stats.noteMoyenne > 0 ? `${stats.noteMoyenne.toFixed(1)}/5` : "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table Premium */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Travaux Récents</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vos dernières missions</p>
          </div>
          <Link href="/dashboard/couturier/commandes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:gap-3 transition-all">
            Gérer mes commandes
          </Link>
        </div>

        <div className="overflow-x-auto">
          {commandes.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                <ShoppingBag size={48} />
              </div>
              <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">Vous n&apos;avez aucune commande active pour le moment.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  {["Référence", "Service", "Client", "Échéance", "Statut", "Action"].map((h) => (
                    <th key={h} className="text-[10px] font-black uppercase tracking-[0.2em] text-left px-10 py-5 text-gray-400 border-b border-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commandes.map((c) => (
                  <tr key={c._id} className={`hover:bg-[#F5EFE6]/30 transition-colors group ${c.status === "LATE" || c.is_late ? "bg-red-50/50" : ""}`}>
                    <td className="px-10 py-6">
                      <span className="text-xs font-black text-[#2D6A4F]">#{c._id?.slice(-6)}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-bold text-gray-700">{c.service_type}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-[#2D6A4F]">
                          {typeof c.client_id === "object" ? c.client_id?.name?.charAt(0) : "C"}
                        </div>
                        <span className="text-xs font-bold text-gray-600">{typeof c.client_id === "object" ? c.client_id?.name : "Client"}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Clock size={14} className={c.status === "LATE" ? "text-red-500" : "text-[#2D6A4F]"} />
                        {formatDate(c.date_rendez_vous || c.createdAt)}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="inline-flex">
                        <Badge status={statusLabel(c.status)} />
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <Link href={`/dashboard/couturier/commandes/${c._id}`}>
                        <button className="px-5 py-2 bg-[#2D6A4F] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1B4332] shadow-xl shadow-[#2D6A4F]/20 transition-all">
                          Détails
                        </button>
                      </Link>
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
