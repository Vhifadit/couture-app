"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, DollarSign, Users, Star, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { orderApi, couturierApi } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Order, CouturierProfile } from "@/lib/api";

export default function CouturierDashboardPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [profil, setProfil] = useState<CouturierProfile | null>(null);
  const [stats, setStats] = useState({
    revenusMois: 0,
    commandesActives: 0,
    nouveauxClients: 0,
    noteMoyenne: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les commandes du couturier
        const ordersResponse = await orderApi.getAll();
        const orders = ordersResponse.orders || [];
        
        // Calculer les statistiques
        const enCours = orders.filter((o) => 
          ['PLANNED', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status)
        ).length;
        
        // Essayer de récupérer le profil
        let profilData = null;
        try {
          const profilResponse = await couturierApi.getMyProfile();
          profilData = profilResponse.couturier;
        } catch {
          // Le profil n'existe peut-être pas encore
          console.log("Profil couturier non trouvé");
        }
        
        setCommandes(orders.slice(0, 5)); // 5 dernières commandes
        setProfil(profilData);
        
        setStats({
          revenusMois: 0, // À calculer avec les commandes terminées
          commandesActives: enCours,
          nouveauxClients: 0, // À calculer
          noteMoyenne: profilData?.stats?.note_moyenne || 0
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
        <h1 className="text-2xl font-bold text-[#2D6A4F]">Espace Couturier</h1>
        <p className="text-sm mt-1 text-[#718096]">
          Bienvenue {profil?.nom_marque || user?.name || 'Couturier'} ! 
          Gérez vos commandes et votre disponibilité.
        </p>
      </div>

      {/* Message si pas de profil */}
      {!profil && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Vous n&apos;avez pas encore créé votre profil. 
            <Link href="/dashboard/couturier/settings" className="font-medium underline ml-1">
              Créer mon profil
            </Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center justify-center mb-3 rounded-full w-10 h-10 bg-[#EAFAF1] text-[#1E8449]">
            <DollarSign size={20} />
          </div>
          <p className="text-xs text-[#718096]">Revenus du mois</p>
          <p className="text-xl font-bold mt-1 text-[#1B4332]">
            {stats.revenusMois.toLocaleString('fr-FR')} FCFA
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center justify-center mb-3 rounded-full w-10 h-10 bg-[#EBF5FB] text-[#2980B9]">
            <ShoppingBag size={20} />
          </div>
          <p className="text-xs text-[#718096]">Commandes actives</p>
          <p className="text-xl font-bold mt-1 text-[#1B4332]">{stats.commandesActives}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center justify-center mb-3 rounded-full w-10 h-10 bg-[#FEF9E7] text-[#D4AC0D]">
            <Users size={20} />
          </div>
          <p className="text-xs text-[#718096]">Nouveaux clients</p>
          <p className="text-xl font-bold mt-1 text-[#1B4332]">{stats.nouveauxClients}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#C9B99A] shadow-sm">
          <div className="flex items-center justify-center mb-3 rounded-full w-10 h-10 bg-[#FEF5E7] text-[#E67E22]">
            <Star size={20} />
          </div>
          <p className="text-xs text-[#718096]">Note moyenne</p>
          <p className="text-xl font-bold mt-1 text-[#E67E22]">
            {stats.noteMoyenne > 0 ? `${stats.noteMoyenne}/5` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Commandes à traiter */}
      <div className="bg-white rounded-xl overflow-hidden border border-[#C9B99A] shadow-sm">
        <div className="p-5 border-b border-[#F5EFE6]">
          <h2 className="font-bold text-[#2D6A4F]">Commandes à Traiter</h2>
        </div>

        {commandes.length === 0 ? (
          <div className="p-8 text-center text-[#718096]">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
            <p>Vous n&apos;avez pas encore de commandes</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F5EFE6]">
                {["ID", "Service", "Client", "Date", "Statut", "Action"].map((h) => (
                  <th key={h} className="text-xs font-semibold text-left px-5 py-3 text-[#4A5568]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.map((c, i) => (
                <tr key={c._id || i} className="border-t border-[#F5EFE6]">
                  <td className="px-5 py-4 text-sm font-medium text-[#2D6A4F]">
                    #{c._id?.slice(-6) || 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-[#4A5568]">
                    {getServiceLabel(c.service_type)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#4A5568]">
                    {typeof c.client_id === 'object' ? c.client_id?.name : 'Client'}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#718096]">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {formatDate(c.date)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={getStatutDisplay(c.status)} />
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/couturier/commandes/${c._id}`}>
                      <button className="text-xs font-medium px-3 py-1 rounded-md bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors">
                        {c.status === "COMPLETED" ? "Voir détails" : "Mettre à jour"}
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
  );
}

