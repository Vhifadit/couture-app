'use client';

import { useSearchParams } from 'next/navigation';
import { couturierApi, orderApi, CouturierProfile } from '@/lib/api';
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form state
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!couturierId || !serviceType || !date || !startTime || !endTime) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await orderApi.create({
        couturier_id: couturierId,
        service_type: serviceType,
        date,
        start_time: startTime,
        end_time: endTime,
        notes,
        livraison: {
          mode: livraisonMode,
        },
      });
      
      setIsSubmitted(true);
    } catch (err) {
      console.error("Erreur lors de la création de la commande:", err);
      setError("Impossible de créer la commande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

        {/* Dates et horaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input 
              type="date" 
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-2">
              Heure de début <span className="text-red-500">*</span>
            </label>
            <input 
              type="time" 
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-2">
              Heure de fin <span className="text-red-500">*</span>
            </label>
            <input 
              type="time" 
              id="end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
        </div>

        {/* Mode de livraison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de réception <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="livraison" 
                value="RETRAIT_ATELIER"
                checked={livraisonMode === "RETRAIT_ATELIER"}
                onChange={() => setLivraisonMode("RETRAIT_ATELIER")}
                className="text-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
            <span className="text-sm text-gray-700">Retrait à l&apos;atelier</span>
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
              <span className="text-sm text-gray-700">Livraison à domicile</span>
            </label>
          </div>
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

        {/* Photos (optionnel) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos de modèle (facultatif)</label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[#C9B99A] px-6 py-10">
            {imagePreview ? (
              <div className="relative group">
                <img src={imagePreview} alt="Aperçu" className="h-48 w-auto object-contain rounded-md" />
                <button type="button" onClick={() => setImagePreview(null)} aria-label="Supprimer l'image" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-[#2D6A4F] focus-within:outline-none hover:text-[#1B4332]">
                    <span>Téléchargez un fichier</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                  <p className="pl-1">ou glissez-déposez</p>
                </div>
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
