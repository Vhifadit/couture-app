"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, User, Scissors, MessageSquare, CheckCircle, Truck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { orderApi, clientApi, Order, ClientProfile } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function CouturierCommandeDetailsPage() {
  const params = useParams();
  const { addToast } = useToast();
  const id = params?.id ? decodeURIComponent(params.id as string) : null;
  
  const [commande, setCommande] = useState<Order | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (order.client_id) {
          // Extraire l'ID utilisateur du client (peut être string ou objet)
          const clientUserId = typeof order.client_id === 'object' ? order.client_id._id : order.client_id;
          try {
            const clientResponse = await clientApi.getByUserId(clientUserId);
            setClient(clientResponse.client);
          } catch {
            console.log("Impossible de charger le profil du client");
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

  const handleStatusChange = async (newStatus: string) => {
    if (!commande || !id) return;
    
    try {
      await orderApi.updateStatus(id, newStatus);
      setCommande({ ...commande, status: newStatus });
      addToast("Statut mis a jour: " + newStatus, "success");
    } catch (err) {
      console.error("Erreur mise a jour:", err);
      addToast("Erreur lors de la mise a jour du statut", "error");
    }
  };

  const getStatutDisplay = (status: string): string => {
    switch (status) {
      case 'PLANNED': return "En attente";
      case 'CONFIRMED': return "Confirme";
      case 'IN_PROGRESS': return "En cours";
      case 'COMPLETED': return "Termine";
      case 'CANCELLED': return "Annule";
      default: return status;
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
        <Link href="/dashboard/couturier/commandes" className="text-[#2D6A4F] mt-4 inline-block">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const clientName = typeof commande.client_id === 'object' 
    ? commande.client_id?.name 
    : 'Client';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/couturier/commandes" 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#2D6A4F]">Commande #{commande._id?.slice(-6)}</h1>
              <Badge status={getStatutDisplay(commande.status)} />
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Calendar size={14} /> Passee le {formatDate(commande.date_rendez_vous)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {commande.status === 'PLANNED' && (
            <>
              <button 
                onClick={() => handleStatusChange('CANCELLED')} 
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
              >
                Refuser
              </button>
              <button 
                onClick={() => handleStatusChange('CONFIRMED')} 
                className="btn-em flex items-center gap-2"
              >
                <CheckCircle size={16} /> Accepter
              </button>
            </>
          )}
          {commande.status === 'CONFIRMED' && (
            <button 
              onClick={() => handleStatusChange('IN_PROGRESS')} 
              className="btn-em flex items-center gap-2 bg-blue-700 hover:bg-blue-800"
            >
              <Scissors size={16} /> Commencer la confection
            </button>
          )}
          {commande.status === 'IN_PROGRESS' && (
            <button 
              onClick={() => handleStatusChange('COMPLETED')} 
              className="btn-em flex items-center gap-2 bg-green-700 hover:bg-green-800"
            >
              <CheckCircle size={16} /> Marquer comme termine
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <Scissors size={20} /> Details de la confection
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type de service</p>
                  <p className="font-medium text-gray-900">{getServiceLabel(commande.service_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rendez-vous</p>
                  <p className="font-medium text-gray-900">{formatDate(commande.date_rendez_vous)} à {commande.heure_rendez_vous}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Date limite</p>
                  <p className="font-medium text-gray-900">{formatDate(commande.date_limite)} à {commande.heure_limite}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Notes du client</p>
                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 italic">
                  {commande.notes || "Aucune note particuliere."}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <Truck size={20} /> Livraison
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Mode</span>
                <span className="font-medium text-gray-900 capitalize">
                  {commande.livraison?.mode === 'LIVRAISON' ? 'Livraison a domicile' : 'Retrait a atelier'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Statut</span>
                <span className="font-medium text-gray-900">
                  {commande.livraison?.statut_livraison === 'EN_ATTENTE' ? 'En attente' :
                   commande.livraison?.statut_livraison === 'EN_COURS' ? 'En cours' :
                   commande.livraison?.statut_livraison === 'LIVREE' ? 'Livree' :
                   'Non defini'}
                </span>
              </div>
              
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

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#C9B99A] shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Client</h2>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <User size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{clientName}</p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
            </div>
            {client && (
              <div className="space-y-3">
                {client.telephone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="font-medium">{client.telephone}</span>
                  </div>
                )}
                {client.adresses && client.adresses.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-[#2D6A4F]" />
                    <span>{client.adresses[0].ville}</span>
                  </div>
                )}
              </div>
            )}
            <Link href="/dashboard/couturier/messages">
              <button className="w-full mt-4 py-2 flex items-center justify-center gap-2 border border-[#2D6A4F] text-[#2D6A4F] rounded-md hover:bg-[#2D6A4F] hover:text-white transition-colors text-sm font-medium">
                <MessageSquare size={16} /> Envoyer un message
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

