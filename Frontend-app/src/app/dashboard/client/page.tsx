"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, MessageSquare, Star, Clock, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { orderApi, clientApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    commandesEnCours: 0,
    totalDepense: 0,
    messagesNonLus: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les commandes du client
        const ordersResponse = await orderApi.getAll();
        const orders = ordersResponse.orders || [];
        
        // Calculer les statistiques
        const enCours = orders.filter((o: any) => 
          ['PLANNED', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status)
        ).length;
        
        // Compter les commandes terminées pour le total
        const terminees = orders.filter((o: any) => o.status === 'COMPLETED');
        
        setCommandes(orders.slice(0, 5)); // 5 dernières commandes
        
        setStats({
          commandesEnCours: enCours,
          totalDepense: 0, // À calculer si les prix sont disponibles
          messagesNonLus: 0 // À implémenter avec l'API chat
        });
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour afficher le statut
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

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour obtenir le nom du service
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D6A4F]">
          Mon Espace Client
        </h1>
        <p className="text-sm mt-1 text-[#718096]">
          Bienvenue {user?.name || 'Client'} ! Voici un aperçu de votre activité.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EBF5FB] text-[#2980B9]">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Commandes en cours</p>
              <p className="text-xl font-bold mt-0.5 text-[#1B4332]">{stats.commandesEnCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FEF9E7] text-[#D4AC0D]">
              <Star size={20} />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Total commandes</p>
              <p className="text-xl font-bold mt-0.5 text-[#1B4332]">{commandes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EAFAF1] text-[#1E8449]">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Messages non lus</p>
              <p className="text-xl font-bold mt-0.5 text-[#1B4332]">{stats.messagesNonLus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau commandes */}
      <div className="bg-white rounded-xl overflow-hidden border border-[#C9B99A] shadow-sm">
        <div className="p-5 border-b border-[#F5EFE6] flex justify-between items-center">
          <h2 className="font-bold text-[#2D6A4F]">Commandes Récentes</h2>
          <Link href="/dashboard/client/commandes" className="text-xs font-medium flex items-center gap-1 text-[#2D6A4F]">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {commandes.length === 0 ? (
          <div className="p-8 text-center text-[#718096]">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p>Vous n'avez pas encore de commandes</p>
            <Link href="/couturiers" className="text-[#2D6A4F] text-sm font-medium mt-2 inline-block">
              Trouver un couturier
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F5EFE6]">
                {["ID", "Service", "Couturier", "Date", "Statut"].map((h) => (
                  <th key={h} className="text-xs font-semibold text-left px-5 py-3 text-[#4A5568]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.map((c: any, i: number) => (
                <tr key={c._id || i} className="border-t border-[#F5EFE6]">
                  <td className="px-5 py-4 text-sm font-medium text-[#2D6A4F]">
                    #{c._id?.slice(-6) || 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#4A5568]">
                    {getServiceLabel(c.service_type)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#4A5568]">
                    {typeof c.couturier_id === 'object' ? c.couturier_id?.name : 'Couturier'}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#718096]">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {formatDate(c.date)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={getStatutDisplay(c.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

