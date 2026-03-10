"use client";

import Badge from "@/components/ui/Badge";
import { Clock, Search, PackageX } from "lucide-react";
import { orderApi, Order } from "@/lib/api";
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import EmptyState from "@/components/ui/EmptyState";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2D6A4F]">Mes Commandes</h1>
        <p className="text-sm mt-1 text-gray-500">Suivez l&apos;état de toutes vos commandes</p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Barre de recherche + filtres */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="searchbar">
          <Search size={16} className="text-ardoise-light shrink-0" />
          <input 
            placeholder="Rechercher une commande..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {filtres.map((f) => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`btn-pill ${filter === f ? "btn-pill-active" : "btn-pill-inactive"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {!isLoading && filteredCommandes.length === 0 ? (
        <EmptyState 
          icon={PackageX}
          title="Aucune commande trouvée"
          description="Vous n'avez pas encore passé de commande ou aucune commande ne correspond à votre recherche."
          action={
            <Link href="/couturiers">
              <button className="btn-em px-6 py-2 rounded-md">Trouver un couturier</button>
            </Link>
          }
        />
      ) : (
        /* Tableau */
        <div className="card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["ID", "Service", "Date", "Statut", "Mode livraison", "Action"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                filteredCommandes.map((c: Order) => (
                  <tr key={c._id} className="table-row">
                    <td className="table-cell font-medium text-em">#{c._id?.slice(-6)}</td>
                    <td className="table-cell font-medium text-ardoise">{getServiceLabel(c.service_type)}</td>
                    <td className="table-cell text-ardoise-light">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : "-"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge status={getStatutDisplay(c.status)} />
                    </td>
                    <td className="table-cell text-ardoise-light">
                      {c.livraison?.mode === "LIVRAISON" ? "Livraison" : "Retrait"}
                    </td>
                    <td className="table-cell">
                      <Link href={`/dashboard/client/commandes/${c._id}`}>
                        <button className={c.status === "COMPLETED" ? "btn-outline" : "btn-em"}>
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
      )}
    </div>
  );
}
