'use client';

import { useState, useEffect, use } from "react";
import { couturierApi, articleApi, CouturierProfile, Article, Photo } from "@/lib/api";
import { normalizePhotoUrl } from "@/lib/utils";
import { MapPin, Phone, Star, CheckCircle, XCircle, ArrowLeft, Image as ImageIcon, Loader2, Calendar, ShoppingBag, MessageCircle } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/dashboard/layout";

export default function ProfilCouturierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [couturier, setCouturier] = useState<CouturierProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<{ 
    photos: Photo[], 
    titre: string, 
    description?: string, 
    prix?: number, 
    categorie?: string,
    id?: string
  } | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const couturierData = await couturierApi.getById(id);
        setCouturier(couturierData.couturier);
        
        const articlesData = await articleApi.getByCouturier(id);
        setArticles(articlesData.articles || []);
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="animate-spin text-[#2D6A4F]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] animate-pulse">Immersion dans l&apos;atelier...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!couturier) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500">
             <XCircle size={48} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Artisan Introuvable</h1>
            <p className="text-sm text-gray-400 font-medium mt-2">Le profil que vous recherchez semble avoir été déplacé ou n&apos;existe plus.</p>
          </div>
          <Link href="/couturiers">
            <button className="px-10 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/20 hover:scale-[1.05] transition-all">
              Explorer d&apos;autres talents
            </button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const [longitude, latitude] = couturier.localisation?.coordinates || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10">
        {/* Navigation Back */}
        <Link href="/couturiers" className="group inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#2D6A4F] transition-all">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:-translate-x-1 transition-transform shadow-sm">
             <ArrowLeft size={16} />
          </div>
          Retour aux couturiers
        </Link>

        {/* Hero Profil Card Premium */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="relative h-48 md:h-64 bg-linear-to-r from-[#2D6A4F] to-[#52B788] overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-size-[40px_40px]"></div>
             <div className="absolute -bottom-1 w-full h-24 bg-linear-to-t from-white to-transparent"></div>
          </div>

          <div className="px-10 pb-12 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-10 items-start md:items-end">
              {/* Photo Profil */}
              <div className="relative group">
          <div className="w-40 h-40 rounded-4xl border-10 border-white shadow-2xl bg-white overflow-hidden shrink-0">
                  {couturier.photos?.[0] ? (
                    <img 
                      src={normalizePhotoUrl(couturier.photos[0].url)} 
                      alt={couturier.nom_marque}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#2D6A4F] text-5xl font-black">
                      {couturier.nom_marque?.[0] || "C"}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2">
                   <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg ${couturier.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>

              {/* Infos Main */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-4xl font-black text-[#2D6A4F] uppercase tracking-tight leading-none">{couturier.nom_marque}</h1>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      couturier.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-50 text-green-600 border-green-100' : 
                      couturier.disponibilite_statut === 'OCCUPE' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {couturier.disponibilite_statut}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                       <MapPin size={14} className="text-[#2D6A4F]" />
                       {couturier.adresse?.ville}, {couturier.adresse?.quartier || "Quartier libre"}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                       <Star size={14} fill="currentColor" />
                       {couturier.stats?.note_moyenne?.toFixed(1) || "0.0"} / 5
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 font-bold max-w-2xl leading-relaxed italic border-l-4 border-[#2D6A4F]/10 pl-4 py-1">
                  &quot;{couturier.description || "Maître couturier spécialisé dans la haute couture et les confections d'exception."}&quot;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                <Link href={`/dashboard/client/commandes/new?couturierId=${couturier._id}`}>
                  <button className={`w-full px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${
                    couturier.disponibilite_statut === 'DISPONIBLE' 
                      ? 'bg-[#2D6A4F] text-white hover:bg-[#1B4332] shadow-[#2D6A4F]/30 hover:scale-[1.02] active:scale-95' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                    <ShoppingBag size={18} />
                    Passer commande
                  </button>
                </Link>
                <button className="w-full px-10 py-5 bg-white border border-gray-100 text-[#2D6A4F] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5EFE6] transition-all flex items-center justify-center gap-3">
                  <MessageCircle size={18} />
                  Contacter l&apos;atelier
                </button>
              </div>
            </div>

            {/* Badges & Stats Row */}
            <div className="mt-12 pt-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Services Proposés</p>
                  <div className="flex flex-wrap gap-2">
                    {couturier.services?.map((service: string, i: number) => (
                      <span key={i} className="px-5 py-2.5 rounded-2xl bg-[#F5EFE6]/50 text-[#2D6A4F] text-[9px] font-black uppercase tracking-widest border border-[#2D6A4F]/5">
                        {service.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tarifs Indicatifs</p>
                  <div className="flex flex-col gap-3">
                    {couturier.tarifs && Object.entries(couturier.tarifs).slice(0, 3).map(([key, value], i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50/50 px-6 py-3 rounded-2xl border border-gray-50 transition-colors hover:bg-white hover:shadow-sm">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-black">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-black text-[#2D6A4F]">{value?.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Coordonnées</p>
                  <div className="space-y-3">
                    {couturier.telephone && (
                      <div className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <Phone size={18} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Appel direct</span>
                            <span className="text-xs font-black text-gray-700">{couturier.telephone}</span>
                         </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                       <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                          <Calendar size={18} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Délai moyen</span>
                          <span className="text-xs font-black text-gray-700">7 à 14 jours</span>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Content Tabs / Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Galerie Réalisations */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-10 bg-[#2D6A4F] rounded-full"></div>
               <h2 className="text-2xl font-black text-[#2D6A4F] uppercase tracking-tight">Réalisations de l&apos;Atelier</h2>
            </div>
            
            {articles.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-24 text-center border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                   <ImageIcon size={40} />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aucune réalisation publiée pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {articles.map((article) => (
                  <div 
                    key={article._id} 
                    className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer hover:-translate-y-2"
                    onClick={() => {
                      if (article.photos && article.photos.length > 0) {
                        setSelectedAlbum({ 
                          photos: article.photos, 
                          titre: article.titre,
                          description: article.description,
                          prix: article.prix,
                          categorie: article.categorie,
                          id: article._id
                        });
                        setActivePhotoIdx(0);
                      }
                    }}
                  > 
                    <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                      {article.photos && article.photos.length > 0 ? (
                        <div className={`grid ${article.photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 h-full`}>
                          {article.photos.slice(0, 4).map((p, idx) => (
                            <div key={idx} className={`relative ${article.photos && article.photos.length === 3 && idx === 0 ? 'row-span-2' : ''} h-full overflow-hidden`}>
                              <img 
                                src={normalizePhotoUrl(p.url)} 
                                alt={article.titre}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute top-6 right-6">
                         <span className="bg-white/95 backdrop-blur-md text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg border border-white/20">
                           {article.categorie}
                         </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {article.categorie?.replace(/_/g, ' ')}
                          </span>
                          <h3 className="font-black text-[#2D6A4F] text-xl uppercase tracking-tight">{article.titre}</h3>
                        </div>
                        {article.prix > 0 && (
                          <div className="flex flex-col items-end shrink-0">
                             <span className="text-[11px] font-black text-[#2D6A4F] px-4 py-2 bg-[#F5EFE6]/50 rounded-xl">
                               {article.prix.toLocaleString()} FCFA
                             </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed line-clamp-2 italic">
                        {article.description || "Une création artisanale unique réalisée avec passion."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area Premium */}
          <div className="space-y-10">
            {/* Map Section */}
            {typeof latitude === "number" && typeof longitude === "number" && (latitude !== 0 || longitude !== 0) && (
              <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-green-50 text-[#2D6A4F] flex items-center justify-center">
                      <MapPin size={20} />
                   </div>
                   <h2 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">Accès Atelier</h2>
                </div>
                <div className="aspect-square w-full rounded-4xl overflow-hidden border border-gray-100 shadow-inner group">
                  <iframe
                    title={`Carte atelier ${couturier.nom_marque}`}
                    className="h-full w-full grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.005}%2C${longitude + 0.005}%2C${latitude + 0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                  />
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-relaxed">
                    {[couturier.adresse?.rue, couturier.adresse?.quartier, couturier.adresse?.ville].filter(Boolean).join(", ")}
                  </p>
                </div>
                <a 
                   href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block w-full py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-xl shadow-[#2D6A4F]/10 hover:scale-105 transition-all"
                >
                   Ouvrir dans Google Maps
                </a>
              </div>
            )}

            {/* Tips / Info Section */}
            <div className="bg-[#2D6A4F] rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-[#2D6A4F]/20">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000"></div>
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tight leading-tight">Conseil Pro TailleurConnect</h3>
                  <p className="text-sm font-bold text-white/80 leading-relaxed">
                    Pour un résultat optimal, préparez vos mesures et vos inspirations tissus avant de commander.
                  </p>
                  <div className="pt-4 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <CheckCircle size={18} />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">Paiement Sécurisé</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Album Photo Plein Écran (Lightbox Premium) */}
      {selectedAlbum && (
                <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex flex-col md:flex-row animate-in fade-in duration-500">
          {/* Main View Area */}
          <div className="flex-1 flex flex-col h-full relative">
            <div className="flex justify-between items-center p-8 text-white relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Galerie Atelier</span>
                <h3 className="text-xl font-black uppercase tracking-tight truncate max-w-xs md:max-w-md">{selectedAlbum.titre}</h3>
              </div>
              <button 
                onClick={() => setSelectedAlbum(null)}
                aria-label="Fermer la galerie"
                title="Fermer la galerie"
                className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all md:hidden"
              >
                <XCircle size={32} />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-10 relative group h-full">
              <button 
                disabled={activePhotoIdx === 0}
                onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(prev => prev - 1); }}
                aria-label="Photo precedente"
                title="Photo precedente"
                className="absolute left-10 z-10 w-16 h-16 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-0 hover:scale-110 active:scale-95"
              >
                <ArrowLeft size={32} />
              </button>

              <div className="relative group/img max-w-[90%] max-h-[80vh]">
                <img 
                  src={normalizePhotoUrl(selectedAlbum.photos[activePhotoIdx].url)} 
                  alt="Détail" 
                  className="w-full h-full object-contain shadow-[0_0_100px_rgba(45,106,79,0.2)] animate-in zoom-in-95 duration-500 rounded-3xl"
                />
              </div>

              <button 
                disabled={activePhotoIdx === selectedAlbum.photos.length - 1}
                onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(prev => prev + 1); }}
                aria-label="Photo suivante"
                title="Photo suivante"
                className="absolute right-10 z-10 w-16 h-16 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-0 hover:scale-110 active:scale-95"
              >
                <ArrowLeft size={32} className="rotate-180" />
              </button>
            </div>

            <div className="p-8 flex justify-center gap-4 overflow-x-auto no-scrollbar bg-black/40 backdrop-blur-md">
              {selectedAlbum.photos.map((p, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  aria-label={`Afficher la photo ${idx + 1}`}
                  title={`Afficher la photo ${idx + 1}`}
                  className={`w-16 h-16 md:w-24 md:h-24 rounded-4xl overflow-hidden border-4 transition-all shrink-0 ${activePhotoIdx === idx ? 'border-[#2D6A4F] scale-110 shadow-[0_0_30px_rgba(45,106,79,0.4)]' : 'border-transparent opacity-30 hover:opacity-100 hover:scale-105'}`}
                >
                  <img src={normalizePhotoUrl(p.url)} alt={`Miniature ${idx + 1} de ${selectedAlbum.titre}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Area with Details Premium */}
          <div className="w-full md:w-112.5 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-700">
             <div className="hidden md:flex justify-between items-center p-10 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fiche Réalisation</span>
                <button 
                  onClick={() => setSelectedAlbum(null)}
                  aria-label="Fermer la fiche realisation"
                  title="Fermer la fiche realisation"
                  className="w-12 h-12 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all"
                >
                  <XCircle size={24} />
                </button>
             </div>
             
             <div className="p-10 flex flex-col gap-10 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-[#F5EFE6] text-[#2D6A4F] text-[9px] font-black uppercase tracking-widest rounded-full">
                      {selectedAlbum.categorie?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-[#2D6A4F] uppercase tracking-tight leading-tight">{selectedAlbum.titre}</h2>
                  <div className="flex flex-col gap-1 pt-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Estimation Atelier</span>
                    <p className="text-3xl font-black text-[#2D6A4F] tracking-tight">
                      {selectedAlbum.prix && selectedAlbum.prix > 0 ? `${selectedAlbum.prix.toLocaleString()} FCFA` : 'Sur devis'}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-6 bg-[#2D6A4F] rounded-full"></div>
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description détaillée</h4>
                  </div>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed italic whitespace-pre-wrap pl-4 border-l-2 border-gray-50">
                    &quot;{selectedAlbum.description || "Ce modèle exclusif témoigne de la précision et de la créativité de notre atelier. Chaque détail a été pensé pour sublimer la coupe et le tombé du tissu."}&quot;
                  </p>
                </div>

                <div className="mt-auto pt-10">
                  <Link href={`/dashboard/client/commandes/new?couturierId=${couturier._id}&type=${selectedAlbum.categorie}&titre=${encodeURIComponent(selectedAlbum.titre)}&description=${encodeURIComponent(selectedAlbum.description || '')}&articleId=${selectedAlbum.id}`}>
                    <button className="w-full bg-[#2D6A4F] text-white py-6 rounded-4xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(45,106,79,0.3)] hover:scale-105 transition-all">
                      Commander ce modèle
                    </button>
                  </Link>
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
