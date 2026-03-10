import { couturierApi, articleApi, CouturierProfile, Article } from "@/lib/api";
import { MapPin, Phone, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/dashboard/layout";

const API_BASE = 'http://localhost:3001/api';

async function fetchCouturier(id: string): Promise<CouturierProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/couturiers/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Erreur HTTP:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    return data.couturier;
  } catch (e) {
    console.error('Erreur fetch:', e);
    return null;
  }
}

async function fetchArticles(couturierId: string): Promise<Article[]> {
  try {
    const res = await fetch(`${API_BASE}/articles/couturier/${couturierId}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.articles || [];
  } catch (e) {
    console.error('Erreur fetch articles:', e);
    return [];
  }
}

export default async function ProfilCouturierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  console.log("ID du couturier:", id);
  
  // Récupérer les données du couturier directement avec fetch
  const couturier = await fetchCouturier(id);
  const articles = await fetchArticles(id);

  if (!couturier) {
    return (
      <DashboardLayout>
        <div className="text-center p-10">
            <p className="text-xl font-bold text-em">Couturier introuvable</p>
            <Link href="/couturiers" className="text-sm text-ardoise-light underline mt-2 block">
              Retour à la liste
            </Link>
          </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Link href="/couturiers" className="inline-flex items-center gap-2 text-ardoise hover:text-em transition-colors -mt-2 mb-2">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>


        {/* Carte profil */}
        <div className="card p-6">
          <div className="flex gap-6 items-start">
            {/* Avatar / Photo */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shrink-0 avatar-pierre">
              {couturier.photos?.[0] ? (
                <img 
                  src={couturier.photos[0].url} 
                  alt={couturier.nom_marque}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                couturier.nom_marque?.[0] || "C"
              )}
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-em">{couturier.nom_marque}</h1>
                {couturier.disponibilite ? (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                    <CheckCircle size={12} /> Disponible
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600">
                    <XCircle size={12} /> Occupé
                  </span>
                )}
              </div>

              <p className="text-sm text-ardoise-light mt-2">{couturier.description}</p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-ardoise">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-em" />
                  {couturier.adresse?.ville}{couturier.adresse?.quartier ? `, ${couturier.adresse.quartier}` : ''}
                </span>
                {couturier.telephone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} className="text-em" />{couturier.telephone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                  <Star size={14} fill="currentColor" />{couturier.stats?.note_moyenne?.toFixed(1) || "N/A"}/5
                </span>
              </div>
            </div>

            {/* Bouton commander */}
            <div className="shrink-0">
              <Link href={`/dashboard/client/commandes/new?couturierId=${couturier._id}`}>
                <button className="btn-em px-5 py-2 rounded-md">
                  {couturier.disponibilite ? "Commander" : "Contacter"}
                </button>
              </Link>
            </div>
          </div>

          {/* Services / Spécialités */}
          <div className="mt-5 pt-5 border-b-pierre">
            <p className="text-sm font-semibold text-ardoise mb-2">Services proposés</p>
            <div className="flex flex-wrap gap-2">
              {couturier.services?.map((service: string, i: number) => {
                // Fonction pour convertir le type de service en format d'affichage
                const getServiceLabel = (s: string): string => {
                  switch (s) {
                    case 'RETOUCHE': return "Retouche";
                    case 'CREATION_SUR_MESURE': return "Création sur mesure";
                    case 'CONFECTION': return "Confection";
                    case 'AUTRE': return "Autre";
                    default: return s.replace(/_/g, ' ');
                  }
                };
                return (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-pierre-light text-em font-medium border-pierre">
                    {getServiceLabel(service)}
                  </span>
                );
              })}
            </div>
          </div>
          
          {/* Tarifs */}
          {couturier.tarifs && Object.keys(couturier.tarifs).length > 0 && (
            <div className="mt-5 pt-5">
              <p className="text-sm font-semibold text-ardoise mb-2">Tarifs</p>
              <div className="flex flex-wrap gap-4">
                {Object.entries(couturier.tarifs).map(([key, value], i) => (
                  <div key={i} className="text-sm">
                    <span className="text-ardoise-light">{key.replace(/_/g, ' ')}: </span>
                    <span className="font-semibold text-em">{value?.toLocaleString()}FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Articles publiés */}
        <div>
          <h2 className="text-xl font-bold text-em mb-4">Réalisations & Articles</h2>
          {articles.length === 0 ? (
            <div className="card p-8 text-center text-ardoise-light text-sm">
              Aucun article publié pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {articles.map((article: Article) => (
                <div key={article._id} className="card p-0 overflow-hidden"> 
                  {/* Photo de l'article */}
                  <div className="w-full flex items-center justify-center text-white text-3xl font-bold bg-[#C9B99A] h-35">
                    {article.photos?.[0] ? (
                      <img 
                        src={article.photos[0].url} 
                        alt={article.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      article.titre?.[0] || "A"
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-em">{article.titre}</p>
                    <p className="text-xs text-ardoise-light mt-1">{article.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pierre-light text-ardoise">
                        {article.categorie}
                      </span>
                      {article.prix > 0 && (
                        <span className="text-xs font-bold text-em-dark">
                          {article.prix.toLocaleString()}FCFA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
