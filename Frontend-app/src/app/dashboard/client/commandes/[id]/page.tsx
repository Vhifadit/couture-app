"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Scissors, MessageSquare, Truck, Clock, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { orderApi, clientApi, Order, CouturierProfile } from "@/lib/api";

export default function ClientCommandeDetailsPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id as string) : null;
  
  const [commande, setCommande] = useState<Order | null>(null);
  const [couturier, setCouturier] = useState<CouturierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID de commande invalide");
        setIsLoading(false);
        return;
      }

      try {
        const orderResponse = await orderApi.getById(id);
        const order = orderResponse.order;
        setCommande(order);

        if (order.couturier_id) {
          // Extraire l'ID utilisateur du couturier (peut être string ou objet)
          const couturierUserId = typeof order.couturier_id === 'object' ? order.couturier_id._id : order.couturier_id;
          try {
            const couturierResponse = await clientApi.getCouturierByUserId(couturierUserId);
            setCouturier(couturierResponse.couturier);
          } catch {
            console.log("Impossible de charger le profil du couturier");
          }
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les details de la commande");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatutDisplay = (status: string): string => {
    switch (status) {
      case 'PLANNED': return "En attente";
      case 'CONFIRMED': return "Confirme";
      case 'IN_PROGRESS': return "En cours";
      case 'READY': return "Pret a recuperer";
      case 'DELIVERED': return "Livre";
      case 'LATE': return "En retard";
      case 'COMPLETED': return "Termine";
      case 'CANCELLED': return "Annule";
      default: return status;
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    await orderApi.cancelOrder(id);
    setCommande((current) => current ? { ...current, status: "CANCELLED" } : current);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await orderApi.addReview(id, { note: reviewNote, commentaire: reviewComment });
      setReviewMessage("Merci, votre avis a ete enregistre.");
    } catch {
      setReviewMessage("Impossible d'enregistrer cet avis. Il a peut-etre deja ete envoye.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'RETOUCHE': return "Retouche";
      case 'CREATION_SUR_MESURE': return "Creation sur mesure";
      case 'CONFECTION': return "Confection";
      case 'AUTRE': return "Autre";
      default: return service || "Non спеcifie";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
      </div>
    );
  }

  if (error || !commande) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600">{error || "Commande introuvable"}</p>
        <Link href="/dashboard/client/commandes" className="text-[#2D6A4F] mt-4 inline-block">
          Retour a mes commandes
        </Link>
      </div>
    );
  }

  const couturierName = typeof commande.couturier_id === 'object' 
    ? commande.couturier_id?.name 
    : 'Couturier';
  const couturierId = typeof commande.couturier_id === 'object' 
    ? commande.couturier_id?._id 
    : commande.couturier_id;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/client/commandes" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#2D6A4F]">Commande #{commande._id?.slice(-6)}</h1>
            <Badge status={getStatutDisplay(commande.status)} />
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Clock size={14} /> Passee le {formatDate(commande.date_rendez_vous)}
          </p>
        </div>
      </div>
      {["PLANNED", "MODIFIED"].includes(commande.status) && (
        <button
          onClick={handleCancel}
          className="w-fit rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Annuler la commande
        </button>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <Scissors size={20} /> Details de la commande
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Type de service</span>
                <span className="font-medium text-gray-900">{getServiceLabel(commande.service_type)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Rendez-vous</span>
                <span className="font-medium text-gray-900">{formatDate(commande.date_rendez_vous)} à {commande.heure_rendez_vous}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Date limite</span>
                <span className="font-medium text-gray-900">{formatDate(commande.date_limite)} à {commande.heure_limite}</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-600 block mb-1">Notes</span>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">
                  {commande.notes || "Aucune note supplementaire."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <Truck size={20} /> Livraison et Reception
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Mode de reception</span>
                <span className="font-medium text-gray-900 capitalize">
                  {commande.livraison?.mode === 'LIVRAISON' ? 'Livraison a domicile' : 'Retrait a atelier'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Statut livraison</span>
                <span className="font-medium text-gray-900">
                  {commande.livraison?.statut_livraison === 'EN_ATTENTE' ? 'En attente' :
                   commande.livraison?.statut_livraison === 'EN_COURS' ? 'En cours' :
                   commande.livraison?.statut_livraison === 'LIVREE' ? 'Livree' :
                   'Non defini'}
                </span>
              </div>
              
              {commande.livraison?.mode === 'RETRAIT_ATELIER' && couturier && (
                <div className="pt-2">
                  <span className="text-gray-600 block mb-1">Adresse de retrait</span>
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    <MapPin size={16} className="text-[#2D6A4F]" />
                    {couturier.adresse?.rue ? (
                      <span>{couturier.adresse.rue}, {couturier.adresse.ville}</span>
                    ) : (
                      <span>{couturier.adresse?.ville || 'Voir profil'}</span>
                    )}
                  </div>
                </div>
              )}

              {commande.livraison?.mode === 'LIVRAISON' && commande.livraison?.adresse_livraison && (
                <div className="pt-2">
                  <span className="text-gray-600 block mb-1">Adresse de livraison</span>
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    <MapPin size={16} className="text-[#2D6A4F]" />
                    <span>
                      {commande.livraison.adresse_livraison.rue}, {commande.livraison.adresse_livraison.quartier}, {commande.livraison.adresse_livraison.ville}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

          {["DELIVERED", "COMPLETED"].includes(commande.status) && (
            <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4 flex items-center gap-2">
                <Star size={20} /> Evaluer le couturier
              </h2>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((note) => (
                  <button
                    type="button"
                    key={note}
                    onClick={() => setReviewNote(note)}
                    className={note <= reviewNote ? "text-yellow-500" : "text-gray-300"}
                    aria-label={`${note} etoile`}
                  >
                    <Star size={22} fill="currentColor" />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-md border border-[#C9B99A] p-3 text-sm"
                rows={3}
                placeholder="Votre commentaire"
              />
              <button className="btn-em mt-3 rounded-md px-4 py-2 text-sm">Envoyer l'avis</button>
              {reviewMessage && <p className="mt-2 text-sm text-[#2D6A4F]">{reviewMessage}</p>}
            </form>
          )}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Couturier</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#A08060] flex items-center justify-center text-white font-bold text-lg">
                {couturierName?.[0] || 'C'}
              </div>
              <div>
                <p className="font-bold text-[#2D6A4F]">{couturierName}</p>
                {couturierId && (
                  <Link href={`/couturiers/${couturierId}`} className="text-xs text-gray-500 hover:underline">
                    Voir le profil
                  </Link>
                )}
              </div>
            </div>
            <Link href="/dashboard/client/messages">
              <button className="w-full py-2 flex items-center justify-center gap-2 border border-[#2D6A4F] text-[#2D6A4F] rounded-md hover:bg-[#2D6A4F] hover:text-white transition-colors text-sm font-medium">
                <MessageSquare size={16} /> Contacter
              </button>
            </Link>
          </div>

          <div className="bg-[#F5EFE6] p-4 rounded-xl border border-[#C9B99A]">
            <h3 className="font-semibold text-[#2D6A4F] mb-2">Besoin d aide?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Si vous rencontrez un probleme avec cette commande, contactez le couturier.
            </p>
            <Link href="/dashboard/client/messages" className="text-xs font-medium text-gray-500 hover:text-gray-900 underline">
              Signaler un probleme
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

