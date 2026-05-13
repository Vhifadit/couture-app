'use client';

import { Scissors } from "lucide-react";
import { couturierApi, CouturierProfile } from "@/lib/api";
import { LocateFixed, MapPin, Star, Search, Map, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import { normalizePhotoUrl } from "@/lib/utils";
import DashboardLayout from "@/app/dashboard/layout";
import { useState, useEffect, useRef } from "react";
import CouturierCardSkeleton from "@/components/ui/CouturierCardSkeleton";

type AddressSuggestion = {
  lat: string;
  lon: string;
  display_name: string;
};

export default function CouturiersPage() {
  const [couturiers, setCouturiers] = useState<CouturierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [disponibiliteFilter, setDisponibiliteFilter] = useState("disponible");
  const [villeFilter, setVilleFilter] = useState("");
  const [adresseFilter, setAdresseFilter] = useState("");
  const [geoPosition, setGeoPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCouturiers = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Le backend supporte `q`, `ville`, `quartier`, `disponible`.
        // Le type actuel de `couturierApi.search` ne contient pas encore `q`, donc on l'élargit via cast.
        const params = {} as Parameters<typeof couturierApi.search>[0] & {
          q?: string;
          ville?: string;
          quartier?: string;
        };

        // Filtres texte / localisations (conformes à la barre)
        if (searchTerm.trim()) params.q = searchTerm.trim();
        if (villeFilter) params.ville = villeFilter;

        // La barre demande "Ville ou quartier".
        // On envoie le texte en `q` pour que le backend applique ses regex
        // sur `adresse.ville` et `adresse.quartier`.
        if (adresseFilter.trim()) {
          params.q = params.q ? `${params.q} ${adresseFilter.trim()}` : adresseFilter.trim();
        }

        if (disponibiliteFilter === "disponible") params.disponible = true;
        if (disponibiliteFilter === "occupe" || disponibiliteFilter === "absent") params.disponible = false;

        if (geoPosition) {
          // Le backend supporte /nearby pour la distance. Ici on n'appelle pas /nearby,
          // on force au minimum la disponibilité.
          params.disponible = true;
        }
        
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
  }, [adresseFilter, disponibiliteFilter, geoPosition, villeFilter, searchTerm]);


  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setDisponibiliteFilter("disponible");
        setGeoLoading(false);
      },
      () => {
        setError("Impossible de récuperer votre position. Veuillez vérifier les permissions et réessayer.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // L'API backend applique q/villes/quartier : on n'applique plus de filtre local
  // pour que les résultats correspondent exactement à la barre.
  const filteredCouturiers = couturiers;

  const resetFilters = () => {
    setSearchTerm("");
    setDisponibiliteFilter("");
    setVilleFilter("");
    setAdresseFilter("");
    setGeoPosition(null);
    setAddressSuggestions([]);
  };

  const handleAddressSearch = (query: string) => {
    setAdresseFilter(query);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        const data = await res.json() as AddressSuggestion[];
        setAddressSuggestions(data);
      } catch (err) {
        console.error("Erreur Nominatim:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    const { lat, lon, display_name } = suggestion;
    setGeoPosition({ latitude: parseFloat(lat), longitude: parseFloat(lon) });

    // display_name peut être "Ville, Région, Pays" (ou plus).
    // Notre backend recherche sur adresse.ville / adresse.quartier via regex.
    // On met donc dans la barre uniquement le 1er segment (la "ville" ou "quartier"),
    // ce qui évite le cas "Cotonou, Littoral, Bénin" qui ne match plus.
    const firstPart = display_name.split(',')[0]?.trim();
    setAdresseFilter(firstPart || display_name);

    setAddressSuggestions([]);
    setDisponibiliteFilter("disponible");
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const { user } = useAuth();
  
  if (user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-10">
          {/* Header Premium */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
                Nos Couturiers
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Trouvez le talent parfait pour vos projets
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                className="px-8 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                <LocateFixed size={18} />
                {geoLoading ? "Recherche..." : "Autour de moi"}
              </button>

              {(searchTerm || adresseFilter || geoPosition) && (
                <button 
                  onClick={resetFilters} 
                  className="px-6 py-5 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Filtres & Recherche Premium */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-[1.5] relative group">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
              <input
                className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.02)]"
                placeholder="Rechercher par nom ou service (ex: Robe, Retouche...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 relative group">
              <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
              <input
                className="w-full pl-14 pr-14 py-5 bg-white border border-gray-100 rounded-[2rem] text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.02)]"
                placeholder="Ville ou quartier"
                value={adresseFilter}
                onChange={(e) => handleAddressSearch(e.target.value)}
              />
              {isSearchingAddress && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-[#2D6A4F]" />
                </div>
              )}
              {addressSuggestions.length > 0 && (
                <div className="absolute top-full left-4 right-4 z-[100] mt-4 bg-white border border-gray-50 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selectAddress(s)}
                      className="w-full text-left px-8 py-5 hover:bg-[#F5EFE6] border-b border-gray-50 last:border-0 transition-colors flex flex-col gap-1"
                    >
                      <span className="text-xs font-black text-[#2D6A4F] uppercase tracking-tight">{s.display_name.split(',')[0]}</span>
                      <span className="text-[10px] text-gray-400 font-bold truncate">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Liste des Couturiers Premium */}
          <div className="min-h-[400px]">
            {error && (
              <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[2rem] text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-in shake duration-500">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => <CouturierCardSkeleton key={index} />)
              ) : filteredCouturiers.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)]">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 mb-8">
                     <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Aucun couturier trouvé</h3>
                  <p className="text-sm text-gray-400 font-medium mt-2 max-w-xs mx-auto">Nous n&apos;avons trouvé aucun talent correspondant à vos critères de recherche.</p>
                  <button onClick={resetFilters} className="mt-10 px-10 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-[1.05] active:scale-95 transition-all">
                    Voir tous les couturiers
                  </button>
                </div>
              ) : (
                filteredCouturiers.map((c: CouturierProfile) => (
                  <div key={c._id} className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                    <div className="h-56 relative overflow-hidden shrink-0">
                      {c.photo ? (
                        <img src={normalizePhotoUrl(c.photo)} alt={c.nom_marque} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : c.photos?.[0] ? (
                        <img src={normalizePhotoUrl(c.photos[0].url)} alt={c.nom_marque} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2D6A4F] text-white text-5xl font-black">
                          {c.nom_marque?.[0]?.toUpperCase()}
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4">
                         <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 border border-white/20">
                            <div className={`w-2 h-2 rounded-full ${c.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-800">{c.disponibilite_statut}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight truncate pr-4">{c.nom_marque}</h3>
                          <div className="flex items-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            <MapPin size={14} className="text-[#2D6A4F]" />
                            <span className="truncate">{c.adresse?.ville}{c.adresse?.quartier ? `, ${c.adresse.quartier}` : ""}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shrink-0">
                          <Star size={14} fill="currentColor" />
                          {c.stats?.note_moyenne?.toFixed(1) || "0.0"}
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed line-clamp-2 mb-6 flex-1">
                        {c.description || "Maître couturier spécialisé dans la confection de haute qualité et le sur-mesure."}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-8">
                         <div className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:bg-[#F5EFE6]/30">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Position</span>
                           {geoPosition && c.localisation?.coordinates ? (
                             <span className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-tight">à {getDistance(geoPosition.latitude, geoPosition.longitude, c.localisation.coordinates[1], c.localisation.coordinates[0]).toFixed(1)} km</span>
                           ) : (
                             <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{c.adresse?.ville || "N/A"}</span>
                           )}
                         </div>
                         <div className="flex flex-col p-4 bg-blue-50/50 rounded-2xl border border-blue-100 transition-all hover:bg-blue-100/50">
                           <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Navigation</span>
                           {c.localisation?.coordinates ? (
                             <a 
                               href={`https://www.google.com/maps/dir/?api=1&destination=${c.localisation.coordinates[1]},${c.localisation.coordinates[0]}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-[10px] font-black text-blue-700 uppercase tracking-tight flex items-center gap-1.5"
                             >
                               GPS <Map size={12} />
                             </a>
                           ) : (
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">Aucun</span>
                           )}
                         </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50 mt-auto flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-300 font-black uppercase tracking-widest">À partir de</span>
                          <span className="text-lg font-black text-[#2D6A4F] tracking-tight">
                            {c.tarifs && (Object.values(c.tarifs).some(v => !!v)) 
                              ? Math.min(...Object.values(c.tarifs).filter(v => !!v).map(v => Number(v))).toLocaleString()
                              : "25.000"} <span className="text-[10px]">FCFA</span>
                          </span>
                        </div>

                        <Link href={`/couturiers/${c._id}`}>
                          <button className="px-8 py-4 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2D6A4F]/20 hover:scale-105 active:scale-95 transition-all">
                            Découvrir
                          </button>
                        </Link>
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
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-10 bg-[#FFF8EF] animate-in fade-in duration-1000">
      <div className="max-w-2xl w-full text-center space-y-10">
        <div className="space-y-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7E7D7] text-[#C46B4D] shadow-sm">
            <Scissors size={30} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#5D6B60] tracking-tight leading-tight">
            Découvrez nos <br />
            <span className="text-[#5D6B60]">Meilleurs Talents</span>
          </h1>
          <div className="w-24 h-1.5 bg-[#5D6B60] mx-auto rounded-full"></div>
          <p className="text-lg text-[#5D6B60] font-semibold max-w-md mx-auto leading-relaxed">
            Rejoignez la communauté TailleurConnect pour accéder aux profils complets de nos artisans.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Link href="/auth">
             <button className="w-full py-6 bg-[#C46B4D] text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_18px_40px_rgba(196,107,77,0.22)] hover:bg-[#B85F42] hover:scale-[1.03] transition-all">
                S&apos;inscrire
             </button>
           </Link>
           <Link href="/auth">
             <button className="w-full py-6 bg-white text-[#27634A] border border-[#E6D3B8] rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#F7E7D7] transition-all">
                Se Connecter
             </button>
           </Link>
        </div>
      </div>
    </div>
  );
}
