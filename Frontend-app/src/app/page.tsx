"use client";

import Header from "@/components/shared/Header";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, Eye, Package, MessageSquare } from "lucide-react";
import { CouturierProfile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fonctionnalites = [
  { icon: <Eye size={26} className="text-pierre-dark" />, label: "Consultation Facile" },
  { icon: <Package size={26} className="text-pierre-dark" />, label: "Commande Personnalisee" },
  { icon: <MessageSquare size={26} className="text-emeraude" />, label: "Suivi de Commande" },
];

// Client component to fetch couturiers
function CouturiersSection() {
  const [couturiers, setCouturiers] = useState<CouturierProfile[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/couturiers/top?limit=3')
      .then(res => res.json())
      .then(data => setCouturiers(data.couturiers || []))
      .catch(console.error);
  }, []);

  return (
    <>
      {couturiers.length > 0 ? (
        <section className="py-10 px-6 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8 text-[#4A5568]">
            Nos Meilleurs Couturiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {couturiers.map((c) => (
              <Link href={`/couturiers/${c._id}`} key={c._id}>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#C9B99A] hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-full flex items-center justify-center text-5xl font-bold text-white bg-[#A08060] h-40">
                    {c.nom_marque?.[0] || 'C'}
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-[#4A5568]">
                        {c.nom_marque}
                      </span>
                      <span className="flex items-center gap-1 text-[#EAB308] text-[13px] font-medium">
                        <Star size={13} fill="currentColor" />
                        {c.stats?.note_moyenne?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#718096] text-xs mt-1">
                      <MapPin size={12} />
                      {c.adresse?.ville || 'Non specifiee'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="py-10 px-6 max-w-5xl mx-auto text-center">
          <p className="text-gray-500">Aucun couturier disponible pour le moment.</p>
        </section>
      )}
    </>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect logged in users to their dashboard
  useEffect(() => {
    if (user) {
      const dashboardPath = user.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
      router.replace(dashboardPath);
    }
  }, [user, router]);

  // Show nothing while redirecting
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      <Header />

      <section className="relative h-64 overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Couture sur mesure"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Couture Sur Mesure
          </h1>
          <p className="text-white text-lg mb-5">
            Des creations uniques a votre mesure.
          </p>
          <Link href="/auth?mode=connexion">
            <button className="px-6 py-2 rounded-md font-medium text-white text-sm bg-[#2D6A4F]">
              Decouvrez Nos Couturiers
            </button>
          </Link>
        </div>
      </section>

      <section className="py-10 px-6 text-center border-b border-pierre">
        <h2 className="text-xl font-bold mb-8 text-[#4A5568]">
          Trouvez Votre Couturier Ideal
        </h2>
        <div className="flex justify-center gap-16 flex-wrap">
          {fonctionnalites.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow bg-[#F5EFE6] border border-[#C9B99A]">
                {f.icon}
              </div>
              <span className="text-sm font-medium text-[#4A5568]">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <CouturiersSection />

      <footer className="text-center py-6 text-sm border-t mt-8 text-[#718096] border-[#C9B99A]">
        2026 TailleurConnect - Tous droits reserves
      </footer>
    </div>
  );
}

