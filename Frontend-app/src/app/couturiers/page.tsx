'use client';

import { couturierApi, CouturierProfile } from "@/lib/api";
import { MapPin, Star, CheckCircle, XCircle, Search } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/dashboard/layout";
import { useState, useEffect } from "react";
import CouturierCardSkeleton from "@/components/ui/CouturierCardSkeleton";

export default function ClientCouturiersPage() {
  const [couturiers, setCouturiers] = useState<CouturierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [disponibiliteFilter, setDisponibiliteFilter] = useState("");
  const [villeFilter, setVilleFilter] = useState("");

  useEffect(() => {
    const fetchCouturiers = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Appel API pour récupérer les couturiers
        const params: { ville?: string; quartier?: string; service?: string; disponible?: boolean } = {};
        
        if (villeFilter) params.ville = villeFilter;
        if (disponibiliteFilter === "disponible") params.disponible = true;
        if (disponibiliteFilter === "occupe") params.disponible = false;
        
        const response = await couturierApi.search(params);
        setCouturiers(response.couturiers || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des couturiers:", err);
        setError("Impossible de charger les couturiers. Veuillez réessayer plus tard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCouturiers();
  }, [disponibiliteFilter, villeFilter]);

  // Filtrage local pour la recherche par nom
  const filteredCouturiers = couturiers.filter((c) =>
    c.nom_marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.services?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6A4F]">Trouver un Couturier</h1>
            <p className="text-sm mt-1 text-gray-500">
              Consultez les couturiers disponibles et leurs réalisations
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Filtres */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="searchbar flex-1">
              <Search size={16} className="text-ardoise-light shrink-0" />
              <input 
                placeholder="Rechercher par nom ou spécialité..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              title="Filtrer par disponibilité" 
              className="btn-outline rounded-md px-3 py-2 text-sm"
              value={disponibiliteFilter}
              onChange={(e) => setDisponibiliteFilter(e.target.value)}
            >
              <option value="">Disponibilité</option>
              <option value="disponible">Disponible</option>
              <option value="occupe">Occupé</option>
            </select>
            <select 
              title="Filtrer par ville" 
              className="btn-outline rounded-md px-3 py-2 text-sm"
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
            >
              <option value="">Toutes les villes</option>
              <option value="cotonou">Cotonou</option>
              <option value="abomey">Abomey-Calavi</option>
            </select>
          </div>

          {/* Grille */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {isLoading ? (
              // Affiche 6 skeletons pendant le chargement
              Array.from({ length: 6 }).map((_, index) => (
                <CouturierCardSkeleton key={index} />
              ))
            ) : filteredCouturiers.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500">
                Aucun couturier trouvé
              </div>
            ) : (
              filteredCouturiers.map((c: CouturierProfile) => (
                <div key={c._id} className="card p-0 overflow-hidden">
                  {/* Photo du couturier */}
                  <div className="w-full flex items-center justify-center text-white text-5xl font-bold bg-[#A08060] h-37.5">
                    {c.photos?.[0] ? (
                      <img 
                        src={c.photos[0].url} 
                        alt={c.nom_marque} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      c.nom_marque?.[0] || "C"
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-em">{c.nom_marque}</p>
                      <span className="flex items-center gap-1 text-xs text-yellow-500 font-semibold">
                        <Star size={12} fill="currentColor" />{c.stats?.note_moyenne?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ardoise-light">
                      <MapPin size={12} />{c.adresse?.ville || c.adresse?.quartier || "Non spécifié"}
                    </div>
                    {c.disponibilite ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle size={12} /> Disponible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                        <XCircle size={12} /> Occupé
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {c.services?.slice(0, 2).map((s: string, i: number) => {
                        // Fonction pour convertir le type de service en format d'affichage
                        const getServiceLabel = (service: string): string => {
                          switch (service) {
                            case 'RETOUCHE': return "Retouche";
                            case 'CREATION_SUR_MESURE': return "Création sur mesure";
                            case 'CONFECTION': return "Confection";
                            case 'AUTRE': return "Autre";
                            default: return service.replace(/_/g, ' ');
                          }
                        };
                        return (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-pierre-light text-ardoise">
                            {getServiceLabel(s)}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Link href={`/couturiers/${c._id}`} className="flex-1">
                        <button className="btn-outline w-full py-2 rounded-md text-sm">Voir profil</button>
                      </Link>
                      {c.disponibilite && (
                        <Link href={`/dashboard/client/commandes/new?couturierId=${c._id}`} className="flex-1">
                          <button className="btn-em w-full py-2 rounded-md text-sm">Commander</button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
