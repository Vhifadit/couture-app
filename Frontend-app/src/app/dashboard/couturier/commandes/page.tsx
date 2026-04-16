"use client";

import Badge from "@/components/ui/Badge";
import { Clock, ClipboardList, Search } from "lucide-react";
import { orderApi, Order } from "@/lib/api";
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

const filtres = ["Tous", "En attente", "En cours", "Terminé"];

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

export default function CouturierCommandesPage() {
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
        setError("Impossible de charger les commandes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommandes();
  }, []);

  // Filtrage local
  const filteredCommandes = commandes.filter((c) => {
    const matchesSearch = searchTerm === "" || 
      c._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "Tous") return matchesSearch;
    if (filter === "En cours") return matchesSearch && c.status === "IN_PROGRESS";
    if (filter === "En attente") return matchesSearch && (c.status === "PLANNED" || c.status === "CONFIRMED");
    if (filter === "Terminé") return matchesSearch && c.status === "COMPLETED";
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-em">Commandes à Traiter</h1>
        <p className="text-sm mt-1 text-ardoise-light">Gérez et suivez toutes vos commandes clients</p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <div className="searchbar">
          <Search size={16} className="text-ardoise-light shrink-0" />
          <input 
            placeholder="Rechercher une commande ou un client..." 
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
          icon={ClipboardList}
          title="Aucune commande"
          description="Vous n'avez aucune commande à traiter pour le moment."
        />
      ) : (
        <div className="card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["ID", "Service", "Client", "Date", "Statut", "Action"].map((h) => (
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
                      {typeof c.client_id === 'object' ? c.client_id?.name || 'Client anonyme' : 'Client anonyme'}
                    </td>
                    <td className="table-cell text-ardoise-light">
                      <span className="flex items-center gap-1">
                      <Clock size={13} /> {c.date_rendez_vous ? new Date(c.date_rendez_vous as string).toLocaleDateString('fr-FR') : new Date(c.createdAt as string).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge status={getStatutDisplay(c.status)} />
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/couturier/commandes/${c._id}`}>
                          <button className="btn-em">
                            {c.status === "COMPLETED" ? "Voir détails" : "Mettre à jour"}
                          </button>
                        </Link>
                      </div>
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

