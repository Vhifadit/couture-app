'use client';

import { useSearchParams } from 'next/navigation';
import { couturierApi, orderApi, CouturierProfile, Address } from '@/lib/api';
import { ArrowLeft, Image as ImageIcon, CheckCircle, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';

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

function NewOrderForm() {
  const searchParams = useSearchParams();
  const couturierId = searchParams.get('couturierId');
  
  const [couturier, setCouturier] = useState<CouturierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);


  
  // Form state
  const [serviceType, setServiceType] = useState("");
  const [dateRendezVous, setDateRendezVous] = useState("");
  const [heureRendezVous, setHeureRendezVous] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [heureLimite, setHeureLimite] = useState("");
  const [notes, setNotes] = useState("");
  const [livraisonMode, setLivraisonMode] = useState<"RETRAIT_ATELIER" | "LIVRAISON">("RETRAIT_ATELIER");

  useEffect(() => {
    const fetchCouturier = async () => {
      if (!couturierId) {
        setError("Aucun couturier spécifié");
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await couturierApi.getById(couturierId);
        setCouturier(response.couturier);
      } catch (err) {
        console.error("Erreur lors de la récupération du couturier:", err);
        setError("Impossible de charger les informations du couturier");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCouturier();
  }, [couturierId]);

  // ✅ NOUVEAU: États pour features avancées
  const [measurements, setMeasurements] = useState({});
const [adresseLivraison, setAdresseLivraison] = useState<Partial<Address>>({ nom: '', rue: '', quartier: '', ville: '' });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// prixEstime removed - not used

  const [clientMesures, setClientMesures] = useState({});

  // ✅ Charger mesures + corriger import clientApi
  useEffect(() => {
    const loadClientData = async () => {
      try {
        // Import dynamique pour éviter erreur circulaire
        const { clientApi } = await import('@/lib/api');
        const mesuresRes = await clientApi.getMeasurements();
        setClientMesures(mesuresRes.mesures || {});
        setMeasurements(mesuresRes.mesures || {});
      } catch (err) {
        console.warn('Mesures non disponibles:', err);
      }
    };
    loadClientData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation dates
    const rdv = new Date(`${dateRendezVous}T${heureRendezVous}`);
    const limite = new Date(`${dateLimite}T${heureLimite}`);
    if (rdv >= limite) {
      setError('Date RDV doit être avant date limite');
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // 📸 FormData pour photos
      const formData = new FormData();
      formData.append('couturier_id', couturierId!);
      formData.append('service_type', serviceType);
      formData.append('date_rendez_vous', dateRendezVous);
      formData.append('heure_rendez_vous', heureRendezVous);
      formData.append('date_limite', dateLimite);
      formData.append('heure_limite', heureLimite);
      formData.append('notes', notes);
      formData.append('measurements', JSON.stringify(measurements));

      // 🏠 Adresse si livraison
      if (livraisonMode === 'LIVRAISON') {
        formData.append('livraison[mode]', 'LIVRAISON');
        formData.append('livraison[adresse_livraison]', JSON.stringify(adresseLivraison));
      }

      // Photos
      selectedFiles.forEach((file, index) => {
        formData.append(`photos[${index}]`, file);
      });

      // TODO: Use FormData for photos when backend supports multipart
      const data = await orderApi.create({

        couturier_id: couturierId!,
        service_type: serviceType,
        date_rendez_vous: dateRendezVous,
        heure_rendez_vous: heureRendezVous,
        date_limite: dateLimite,
        heure_limite: heureLimite,
        notes,
        measurements,
        livraison: livraisonMode === 'LIVRAISON' ? {
          mode: 'LIVRAISON',
          adresse_livraison: {
            nom: adresseLivraison.nom || 'Livraison',
            rue: adresseLivraison.rue || '',
            quartier: adresseLivraison.quartier || '',
            ville: adresseLivraison.ville || ''
          }
        } : undefined

      });

      // TODO: estimation when backend supports it
      setIsSubmitted(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur création commande';
      console.error("Erreur:", err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };





  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  if (error && !couturier) {
    return (
      <div className="text-center p-10 bg-white rounded-xl border border-[#C9B99A]">
        <p className="text-xl font-bold text-red-600">{error}</p>
        <Link href="/couturiers" className="text-sm text-gray-600 underline mt-4 block hover:text-[#2D6A4F]">
          Retour à la liste des couturiers
        </Link>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl border border-[#C9B99A] p-8 flex flex-col items-center gap-5 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50">
          <CheckCircle size={36} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#2D6A4F]">Demande envoyée !</h2>
          <p className="text-sm text-gray-600 mt-2">
            Votre demande a été transmise à <span className="font-semibold text-[#2D6A4F]">{couturier?.nom_marque}</span>.
            <br />
            Vous serez notifié(e) dès qu&apos;elle sera acceptée.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-4">
          <Link href="/dashboard/client/messages" className="flex-1">
            <button className="w-full py-2 rounded-md font-semibold text-sm border border-[#C9B99A] text-[#4A5568] hover:bg-gray-50">
              Contacter
            </button>
          </Link>
          <Link href="/dashboard/client/commandes" className="flex-1">
            <button className="w-full py-2 rounded-md font-semibold text-sm bg-[#2D6A4F] text-white hover:bg-[#1B4332]">
              Voir mes commandes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <Link href={`/couturiers/${couturierId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2D6A4F] transition-colors self-start">
        <ArrowLeft size={16} />
        Retour au profil de {couturier?.nom_marque}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#2D6A4F]">Nouvelle Commande</h1>
        <p className="text-sm mt-1 text-gray-500">
          Décrivez votre besoin pour <span className="font-semibold text-[#2D6A4F]">{couturier?.nom_marque}</span>.
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#C9B99A] rounded-xl p-6 flex flex-col gap-5">
        {/* Type de service */}
        <div>
          <label htmlFor="service-type" className="block text-sm font-medium text-gray-700 mb-2">
            Type de service <span className="text-red-500">*</span>
          </label>
          <select 
            id="service-type" 
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            required 
            className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          >
            <option value="">Choisir un type...</option>
            {couturier?.services?.map(service => (
              <option key={service} value={service}>{getServiceLabel(service)}</option>
            ))}
            <option value="AUTRE">Autre (à préciser)</option>
          </select>
        </div>

        {/* Rendez-vous */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date-rendez-vous" className="block text-sm font-medium text-gray-700 mb-2">
              Date de rendez-vous <span className="text-red-500">*</span>
            </label>
            <input 
              type="date" 
              id="date-rendez-vous"
              value={dateRendezVous}
              onChange={(e) => setDateRendezVous(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
            <p className="text-xs text-gray-500 mt-1">Quand vous rencontrerez le couturier pour les mesures</p>
          </div>
          <div>
            <label htmlFor="heure-rendez-vous" className="block text-sm font-medium text-gray-700 mb-2">
              Heure de rendez-vous <span className="text-red-500">*</span>
            </label>
            <input 
              type="time" 
              id="heure-rendez-vous"
              value={heureRendezVous}
              onChange={(e) => setHeureRendezVous(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
        </div>

        {/* Date limite de livraison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date-limite" className="block text-sm font-medium text-gray-700 mb-2">
              Date limite (livraison) <span className="text-red-500">*</span>
            </label>
            <input 
              type="date" 
              id="date-limite"
              value={dateLimite}
              onChange={(e) => setDateLimite(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
            <p className="text-xs text-gray-500 mt-1">Quand vous souhaitez recevoir votre commande</p>
          </div>
          <div>
            <label htmlFor="heure-limite" className="block text-sm font-medium text-gray-700 mb-2">
              Heure limite (livraison) <span className="text-red-500">*</span>
            </label>
            <input 
              type="time" 
              id="heure-limite"
              value={heureLimite}
              onChange={(e) => setHeureLimite(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
        </div>

        {/* Mode de livraison 🏠 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de réception <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="livraison" 
                value="RETRAIT_ATELIER"
                checked={livraisonMode === "RETRAIT_ATELIER"}
                onChange={() => setLivraisonMode("RETRAIT_ATELIER")}
                className="text-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
              <span className="text-sm text-gray-700">Retrait atelier (gratuit)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="livraison" 
                value="LIVRAISON"
                checked={livraisonMode === "LIVRAISON"}
                onChange={() => setLivraisonMode("LIVRAISON")}
                className="text-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
              <span className="text-sm text-gray-700">Livraison domicile (+1.500 FCFA)</span>
            </label>
          </div>

          {/* 🏠 Formulaire adresse livraison */}
          {livraisonMode === 'LIVRAISON' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border">
              <input
                placeholder="Rue"
                value={adresseLivraison.rue}
                onChange={(e) => setAdresseLivraison({...adresseLivraison, rue: e.target.value})}
                className="p-2 border border-gray-200 rounded-md text-sm"
              />
              <input
                placeholder="Quartier"
                value={adresseLivraison.quartier}
                onChange={(e) => setAdresseLivraison({...adresseLivraison, quartier: e.target.value})}
                className="p-2 border border-gray-200 rounded-md text-sm"
              />
              <input
                placeholder="Ville"
                value={adresseLivraison.ville}
                onChange={(e) => setAdresseLivraison({...adresseLivraison, ville: e.target.value})}
                className="p-2 border border-gray-200 rounded-md text-sm"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description de votre besoin <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            required
            className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] resize-none"
            placeholder="Ex: Je souhaite une robe de soirée longue pour un mariage, en tissu bazin riche de couleur bleue..."
          ></textarea>
        </div>

        {/* 📏 MESURES (pré-remplies) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📏 Vos mesures (optionnel - pré-remplies)
          </label>
          {Object.keys(clientMesures).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {Object.entries(clientMesures).map(([key, value]) => (
                <div key={key} className="text-xs bg-gray-50 p-2 rounded">
                  <span className="font-medium">{key.replace('_', ' ')}:</span>
                  <span className="ml-1">{value}cm</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Aucune mesure sauvegardée. Ajoutez-les depuis votre profil.</p>
          )}
          <button 
            type="button"
            onClick={() => {/* TODO: Éditer mesures */}}
            className="text-xs text-blue-600 hover:underline"
          >
            Modifier mes mesures →
          </button>
        </div>
</xai:function_call >

<xai:function_call name="attempt_completion">
<parameter name="result">
          {Object.keys(clientMesures).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {Object.entries(clientMesures).map(([key, value]) => (
                <div key={key} className="text-xs bg-gray-50 p-2 rounded">
                  <span className="font-medium">{key.replace('_', ' ')}:</span>
                  <span className="ml-1">{value}cm</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Aucune mesure sauvegardée. Ajoutez-les depuis votre profil.</p>
          )}
          <button 
            type="button"
            onClick={() => {/* TODO: Éditer mesures */}}
            className="text-xs text-blue-600 hover:underline"
          >
            Modifier mes mesures →
          </button>
        </div>

        {/* 📸 Photos multiples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos modèles (jusqu&apos;à 3)</label>
          <div className="border-2 border-dashed border-[#C9B99A] rounded-lg p-8 text-center hover:border-[#2D6A4F] transition-colors">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <input
              id="photos-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedFiles(files.slice(0,3));
              }}
              className="sr-only"
            />
            <label htmlFor="photos-upload" className="cursor-pointer block text-sm font-semibold text-[#2D6A4F] hover:text-[#1B4332]">
              Cliquez pour ajouter des photos (max 3)
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu&apos;à 5Mo</p>

            {selectedFiles.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap justify-center">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      title="..."
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-2.5 rounded-md text-sm font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="text-center p-10">Chargement du formulaire...</div>}>
            <NewOrderForm />
        </Suspense>
    )
}
