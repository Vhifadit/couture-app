"use client";

import Header from "@/components/shared/Header";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, Star, Eye, MessageSquare, Scissors, Ruler, Heart } from "lucide-react";
import { CouturierProfile } from "@/lib/api";
import { couturierApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { normalizePhotoUrl } from "@/lib/utils";

const fonctionnalites = [
  { icon: <Eye size={22} />, label: "Voir les ateliers", text: "Photos, notes et savoir-faire en un coup d'oeil." },
  { icon: <Ruler size={22} />, label: "Commander sur mesure", text: "Expliquez votre idee, le couturier affine avec vous." },
  { icon: <MessageSquare size={22} />, label: "Suivre calmement", text: "Messages, delais et avancement restent au meme endroit." },
];

// Client component to fetch couturiers
function CouturiersSection() {
  const { user } = useAuth();
  const [couturiers, setCouturiers] = useState<CouturierProfile[]>([]);

  useEffect(() => {
    const loadTopCouturiers = async () => {
      try {
        const topResponse = await couturierApi.getTop(3);
        let items = topResponse.couturiers || [];

        if (items.length === 0) {
          const searchResponse = await couturierApi.search();
          items = searchResponse.couturiers || [];
        }

        setCouturiers(items.slice(0, 3));
      } catch (error) {
        console.error("Erreur chargement couturiers:", error);
      }
    };
    loadTopCouturiers();
  }, []);

  return (
    <>
      {couturiers.length > 0 ? (
        <section className="px-5 py-16 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
            <div>
              <p className="text-sm font-semibold text-[#C46B4D]">Ateliers à decouvrir</p>
            </div>
            <Link href="/couturiers" className="text-sm font-semibold text-[#27634A] hover:text-[#C46B4D]">
              Voir tous les profils
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {couturiers.map((c) => {
              const detailHref = user ? `/couturiers/${c._id}` : "/auth?mode=connexion";
              const note = c.stats?.note_moyenne ?? (c as CouturierProfile & { note_moyenne?: number }).note_moyenne ?? 0;
              const startPrice = c.tarifs && Object.values(c.tarifs).some(Boolean)
                ? Math.min(...Object.values(c.tarifs).filter(Boolean).map(Number))
                : null;

              return (
                <div key={c._id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#E6D3B8] hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="w-full flex items-center justify-center text-5xl font-bold text-white bg-[#C46B4D] h-44 overflow-hidden">
                    {c.photo ? (
                      <img src={normalizePhotoUrl(c.photo)} alt={c.nom_marque} className="h-full w-full object-cover" />
                    ) : c.photos?.[0]?.url ? (
                      <img src={normalizePhotoUrl(c.photos[0].url)} alt={c.nom_marque} className="h-full w-full object-cover" />
                    ) : (
                      c.nom_marque?.[0] || "C"
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-[#2F3D35]">
                        {c.nom_marque}
                      </span>
                      <span className="flex items-center gap-1 text-[#EAB308] text-[13px] font-medium">
                        <Star size={13} fill="currentColor" />
                        {note.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#718096] text-xs mt-2">
                      <MapPin size={12} />
                      {c.adresse?.ville || 'Non specifiee'}
                    </div>
                    {c.description && (
                      <p className="mt-3 text-sm text-[#5D6B60] leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#F0E3D0] pt-4">
                      <div>
                        <span className="block text-[11px] text-[#8A7A66]">A partir de</span>
                        <span className="text-sm font-bold text-[#27634A]">
                          {startPrice ? `${startPrice.toLocaleString()} FCFA` : "Sur devis"}
                        </span>
                      </div>
                      <Link href={detailHref}>
                        <button className="rounded-xl bg-[#C46B4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B85F42] transition-colors">
                          Voir la fiche
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="py-14 px-6 max-w-5xl mx-auto text-center">
          <p className="text-[#718096]">Aucun couturier disponible pour le moment.</p>
        </section>
      )}
    </>
  );
}

export default function HomePage() {
  useAuth();

  // Removed client-side redirect for logged-in users.
  // Users can now access home page freely; middleware handles protection.

  return (
    <div className="min-h-screen bg-[#FFF8EF]">
      <Header />

      <section className="relative min-h-[560px] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Couture sur mesure"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B2D23]/80 via-[#1B2D23]/45 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 min-h-[560px] flex items-center">
          <div className="max-w-2xl text-white py-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Scissors size={16} />
              Couture locale, commandes simples
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
              Trouvez le bon atelier pour vos habits sur mesure.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 leading-relaxed max-w-xl">
              TailleurConnect rapproche clients et couturiers avec une experience plus humaine: on regarde, on discute, on commande, puis on suit tranquillement.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 px-5 border-b border-[#E6D3B8]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-8">
            <p className="text-sm font-semibold text-[#C46B4D]">Comment ça marche</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#27634A]">
              Simple, chaleureux, sans complication.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fonctionnalites.map((f, i) => (
              <div key={i} className="bg-white border border-[#E6D3B8] rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F7E7D7] text-[#C46B4D] mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-[#2F3D35]">
                  {f.label}
                </h3>
                <p className="text-sm text-[#718096] mt-2 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 bg-[#F7E7D7]/45">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            ["Pour les clients", "Comparez les ateliers, choisissez le style qui vous parle et gardez vos commandes organisees."],
            ["Pour les couturiers", "Montrez vos realisations, recevez des demandes claires et gerez votre atelier sans lourdeur."],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-4">
              <div className="mt-1 h-10 w-10 rounded-full bg-white border border-[#E6D3B8] flex items-center justify-center text-[#27634A] shrink-0">
                <Heart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#27634A]">{title}</h3>
                <p className="text-sm text-[#5D6B60] mt-1 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CouturiersSection />

      <footer className="text-center py-6 text-sm border-t text-[#718096] border-[#E6D3B8]">
        2026 TailleurConnect - Tous droits reserves
      </footer>
    </div>
  );
}

