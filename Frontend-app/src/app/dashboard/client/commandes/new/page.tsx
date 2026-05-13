'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Image as ImageIcon, Loader2, X, Calendar, Clock, MapPin, Truck, Scissors, Info, AlertCircle } from 'lucide-react';
import { Address, clientApi, CouturierProfile, couturierApi, orderApi, articleApi } from '@/lib/api';
import { normalizePhotoUrl } from '@/lib/utils';

const getServiceLabel = (service: string): string => {
  switch (service) {
    case 'RETOUCHE': return 'Retouche';
    case 'CREATION_SUR_MESURE': return 'Creation sur mesure';
    case 'CONFECTION': return 'Confection';
    case 'AUTRE': return 'Autre';
    default: return service.replace(/_/g, ' ');
  }
};

type MeasurementsState = Record<string, number | string>;

function NewOrderForm() {
  const searchParams = useSearchParams();
  const couturierId = searchParams?.get('couturierId');

  const [couturier, setCouturier] = useState<CouturierProfile | null>(null);
  const [clientMesures, setClientMesures] = useState<MeasurementsState>({});
  const [measurements, setMeasurements] = useState<MeasurementsState>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [serviceType, setServiceType] = useState('');
  const [dateRendezVous, setDateRendezVous] = useState('');
  const [heureRendezVous, setHeureRendezVous] = useState('');
  const [dateLimite, setDateLimite] = useState('');
  const [heureLimite, setHeureLimite] = useState('');
  const [notes, setNotes] = useState('');
  const [livraisonMode, setLivraisonMode] = useState<'RETRAIT_ATELIER' | 'LIVRAISON'>('RETRAIT_ATELIER');
  const [adresseLivraison, setAdresseLivraison] = useState<Partial<Address>>({
    nom: 'Livraison',
    rue: '',
    quartier: '',
    ville: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [prefilledArticle, setPrefilledArticle] = useState<any | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      if (!couturierId) {
        setError('Aucun couturier spécifié');
        setIsLoading(false);
        return;
      }

      try {
        const [couturierResponse, mesuresResponse] = await Promise.all([
          couturierApi.getById(couturierId),
          clientApi.getMeasurements().catch(() => ({ mesures: {} })),
        ]);

        const mesures = (mesuresResponse.mesures || {}) as MeasurementsState;
        setCouturier(couturierResponse.couturier);
        setClientMesures(mesures);
        setMeasurements(mesures);

        const type = searchParams?.get('type');
        const titre = searchParams?.get('titre');
        const desc = searchParams?.get('description');
        const articleId = searchParams?.get('articleId');

        if (type) setServiceType(type);
        if (titre || desc) {
          let prefilledNotes = '';
          if (titre) prefilledNotes += `Modèle sélectionné : ${titre}\n`;
          if (desc) prefilledNotes += `Notes modèle : ${desc}\n`;
          setNotes(prefilledNotes);
        }

        if (articleId) {
          try {
             const artRes = await articleApi.getById(articleId);
             setPrefilledArticle(artRes.article);
          } catch (e) {
             console.error("Erreur chargement article pré-rempli:", e);
          }
        }
      } catch (err) {
        console.error('Erreur chargement formulaire:', err);
        setError('Impossible de charger les informations du couturier');
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [couturierId, searchParams]);

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const rdv = new Date(`${dateRendezVous}T${heureRendezVous}`);
    const limite = new Date(`${dateLimite}T${heureLimite}`);

    if (rdv >= limite) {
      setError('La date de rendez-vous doit être antérieure à la date de livraison souhaitée.');
      return;
    }

    if (!couturierId) {
      setError('Aucun couturier spécifié');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('couturier_id', couturierId);
      fd.append('service_type', serviceType);
      fd.append('date_rendez_vous', dateRendezVous);
      fd.append('heure_rendez_vous', heureRendezVous);
      fd.append('date_limite', dateLimite);
      fd.append('heure_limite', heureLimite);
      fd.append('notes', notes);
      fd.append('measurements', JSON.stringify(measurements));
      
      if (livraisonMode === 'LIVRAISON') {
        fd.append('livraison', JSON.stringify({
          mode: 'LIVRAISON',
          adresse_livraison: {
            nom: adresseLivraison.nom || 'Livraison',
            rue: adresseLivraison.rue || '',
            quartier: adresseLivraison.quartier || '',
            ville: adresseLivraison.ville || '',
          },
        }));
      }

      if (prefilledArticle) {
        fd.append('article_reference', prefilledArticle._id);
      }

      selectedFiles.forEach(file => {
        fd.append('photos', file);
      });

      await orderApi.create(fd);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue lors de la création de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-700">
        <Loader2 className="h-12 w-12 animate-spin text-[#2D6A4F]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D6A4F] animate-pulse">Initialisation de votre commande...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 animate-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-[#2D6A4F] to-[#52B788] flex items-center justify-center">
             <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
               <CheckCircle size={48} />
             </div>
          </div>
          <div className="p-12 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[#2D6A4F] uppercase tracking-tight">Demande Envoyée !</h2>
              <p className="text-sm text-gray-400 font-medium">Votre projet a été transmis avec succès à l&apos;atelier <span className="text-[#2D6A4F] font-black">{couturier?.nom_marque}</span>.</p>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 flex flex-col gap-4 text-left">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#2D6A4F]">
                     <Info size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prochaine étape</p>
                    <p className="text-xs font-bold text-gray-700">Le couturier va examiner votre demande et vous répondra sous peu par message.</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard/client/messages" className="flex-1">
                <button className="w-full py-5 bg-white border border-gray-100 text-[#2D6A4F] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5EFE6] transition-all">
                  Ouvrir la messagerie
                </button>
              </Link>
              <Link href="/dashboard/client/commandes" className="flex-1">
                <button className="w-full py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/20 hover:scale-105 transition-all">
                  Suivre ma commande
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-20">
      {/* Header Back */}
      <Link
        href={`/couturiers/${couturierId}`}
        className="group inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#2D6A4F] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:-translate-x-1 transition-transform shadow-sm">
           <ArrowLeft size={16} />
        </div>
        Retour à l&apos;atelier
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Finaliser votre Projet
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Commande chez {couturier?.nom_marque}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-[2rem] text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-in shake duration-500">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-3 space-y-10">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] space-y-10">
            
            {/* Service Selection */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-[#2D6A4F] flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                  <h2 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">Type de Prestation</h2>
               </div>
               <div className="relative group">
                  <select
                    id="service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    required
                    className="w-full px-8 py-5 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner une prestation...</option>
                    {couturier?.services?.map((service) => (
                      <option key={service} value={service}>
                        {getServiceLabel(service)}
                      </option>
                    ))}
                    <option value="AUTRE">Autre demande</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#2D6A4F]">
                    <ArrowLeft size={16} className="-rotate-90" />
                  </div>
               </div>
            </div>

            {/* Timing Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">Planning & Rendez-vous</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Premier RDV (Mesures)</label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={dateRendezVous}
                        onChange={(e) => setDateRendezVous(e.target.value)}
                        required
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Heure souhaitée</label>
                    <input
                      type="time"
                      value={heureRendezVous}
                      onChange={(e) => setHeureRendezVous(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Livraison Souhaitée</label>
                    <input
                      type="date"
                      value={dateLimite}
                      onChange={(e) => setDateLimite(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Heure Limite</label>
                    <input
                      type="time"
                      value={heureLimite}
                      onChange={(e) => setHeureLimite(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                    />
                  </div>
               </div>
            </div>

            {/* Logistics Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <h2 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">Logistique</h2>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLivraisonMode('RETRAIT_ATELIER')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${livraisonMode === 'RETRAIT_ATELIER' ? 'bg-[#F5EFE6]/50 border-[#2D6A4F] shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 opacity-60 hover:opacity-100'}`}
                  >
                    <MapPin size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Retrait en Atelier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLivraisonMode('LIVRAISON')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${livraisonMode === 'LIVRAISON' ? 'bg-[#F5EFE6]/50 border-[#2D6A4F] shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 opacity-60 hover:opacity-100'}`}
                  >
                    <Truck size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Livraison Domicile</span>
                  </button>
               </div>

               {livraisonMode === 'LIVRAISON' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <input
                      placeholder="Rue"
                      value={adresseLivraison.rue || ''}
                      onChange={(e) => setAdresseLivraison((prev) => ({ ...prev, rue: e.target.value }))}
                      className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 shadow-sm"
                    />
                    <input
                      placeholder="Quartier"
                      value={adresseLivraison.quartier || ''}
                      onChange={(e) => setAdresseLivraison((prev) => ({ ...prev, quartier: e.target.value }))}
                      className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 shadow-sm"
                    />
                    <input
                      placeholder="Ville"
                      value={adresseLivraison.ville || ''}
                      onChange={(e) => setAdresseLivraison((prev) => ({ ...prev, ville: e.target.value }))}
                      className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 shadow-sm"
                    />
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Reference & Notes */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] space-y-10">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <h2 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">Référence & Photos</h2>
               </div>

               {prefilledArticle ? (
                 <div className="p-6 bg-[#F5EFE6]/50 rounded-3xl border border-[#C9B99A]/20 space-y-4">
                    <div className="flex items-center gap-3">
                       <CheckCircle size={16} className="text-[#2D6A4F]" />
                       <span className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-widest">Modèle sélectionné</span>
                    </div>
                    <p className="text-sm font-black text-gray-700 uppercase tracking-tight truncate">{prefilledArticle.titre}</p>
                    <div className="flex flex-wrap gap-2">
                      {prefilledArticle.photos?.map((photo: any, index: number) => (
                        <div key={index} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                           <img src={normalizePhotoUrl(photo.url)} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                    </div>
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-gray-400 italic bg-gray-50 p-6 rounded-3xl border border-gray-50">Aucun modèle spécifique sélectionné. Décrivez votre projet ci-dessous.</p>
               )}

               <div className="relative">
                  <textarea
                    id="description"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    required
                    className="w-full px-8 py-6 bg-gray-50 border border-gray-50 rounded-[2rem] text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all resize-none"
                    placeholder="Décrivez votre besoin, le style, les tissus souhaités..."
                  />
               </div>

               {/* Custom Photo Upload */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Photos Personnelles (Max 3)</label>
                  <div className="grid grid-cols-3 gap-3">
                     {previewUrls.map(({ url }, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                           <img src={url} className="w-full h-full object-cover" alt="" />
                           <button 
                             type="button"
                             onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                             className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                           >
                             <X size={12} />
                           </button>
                        </div>
                     ))}
                     {selectedFiles.length < 3 && (
                        <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2D6A4F] hover:bg-white transition-all group">
                           <ImageIcon size={20} className="text-gray-300 group-hover:text-[#2D6A4F] transition-colors" />
                           <span className="text-[8px] font-black text-gray-300 uppercase group-hover:text-[#2D6A4F]">Ajouter</span>
                           <input 
                             type="file" 
                             className="hidden" 
                             multiple 
                             accept="image/*" 
                             onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 3))} 
                           />
                        </label>
                     )}
                  </div>
               </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 bg-[#2D6A4F] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(45,106,79,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirmer la Demande'}
            </button>
          </div>

          <div className="p-10 bg-amber-50 rounded-[3rem] border border-amber-100 flex gap-6 items-start">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                <Info size={24} />
             </div>
             <div className="space-y-2">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Note Importante</h4>
                <p className="text-xs font-bold text-amber-700/80 leading-relaxed italic">
                  Les tarifs finaux seront discutés et validés avec le couturier après analyse de votre demande.
                </p>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D6A4F]" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Préparation de l&apos;espace création...</p>
      </div>
    }>
      <NewOrderForm />
    </Suspense>
  );
}
