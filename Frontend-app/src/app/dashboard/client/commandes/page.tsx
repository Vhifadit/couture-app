"use client";

import Badge from "@/components/ui/Badge";
import { Clock, Search, PackageX } from "lucide-react";
import { orderApi, Order } from "@/lib/api";
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import Link from "next/link";

const filtres = ["Tous", "En cours", "En attente", "Terminé"];

// Fonction pour convertir le type de service en format d'affichage
const getServiceLabel = (service: string): string => {
  switch (service) {
    case 'RETOUCHE': return "Retouche";
    case 'CREATION_SUR_MESURE': return "Création sur mesure";
    case 'CONFECTION': return "Confection";
    case 'AUTRE': return "Autre";
    default: return service || "-";
  }
};

// Fonction pour convertir le statut API en format d'affichage
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

export default function ClientCommandesPage() {
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Tous");

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await orderApi.getAll();
        setCommandes(response.orders || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des commandes:", err);
        setError("Impossible de charger vos commandes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommandes();
  }, []);

  // Filtrage local
  const filteredCommandes = commandes.filter((c) => {
    // Filtre par terme de recherche
    const matchesSearch = searchTerm === "" || 
      c._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par statut
    if (filter === "Tous") return matchesSearch;
    if (filter === "En cours") return matchesSearch && c.status === "IN_PROGRESS";
    if (filter === "En attente") return matchesSearch && (c.status === "PLANNED" || c.status === "CONFIRMED");
    if (filter === "Terminé") return matchesSearch && c.status === "COMPLETED";
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Mes Commandes
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Historique et suivi de vos projets
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche + filtres Premium */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
          {filtres.map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                filter === f 
                  ? "bg-[#2D6A4F] text-white shadow-xl shadow-[#2D6A4F]/20" 
                  : "bg-white text-gray-400 border border-gray-100 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
          <input 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
          />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in duration-300">
          <PackageX size={16} />
          {error}
        </div>
      )}

      {!isLoading && filteredCommandes.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] p-20 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
             <PackageX size={48} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">Aucune commande</h2>
             <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto mt-2">Vous n&apos;avez pas encore passé de commande correspondant à ces critères.</p>
           </div>
           <Link href="/couturiers">
             <button className="px-10 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-[1.05] active:scale-95 transition-all">
               Trouver un couturier
             </button>
           </Link>
        </div>
      ) : (
        /* Tableau Premium */
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  {["ID", "Service", "Date de RDV", "Statut", "Livraison", "Action"].map((h) => (
                    <th key={h} className="px-8 py-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <TableSkeleton columns={6} rows={5} />
                ) : (
                  filteredCommandes.map((c: Order) => (
                    <tr key={c._id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-[#2D6A4F] bg-[#F5EFE6] px-3 py-1.5 rounded-lg">
                          #{c._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{getServiceLabel(c.service_type)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[11px]">
                          <Clock size={14} className="text-[#2D6A4F]" />
                          {c.date_rendez_vous ? new Date(c.date_rendez_vous).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge status={getStatutDisplay(c.status)} />
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {c.livraison?.mode === "LIVRAISON" ? "À domicile" : "Retrait atelier"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <Link href={`/dashboard/client/commandes/${c._id}`}>
                          <button className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            c.status === "COMPLETED" 
                              ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
                              : "bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20 hover:scale-105 active:scale-95"
                          }`}>
                            {c.status === "COMPLETED" ? "Détails" : "Suivre"}
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
