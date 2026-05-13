/* eslint-disable jsx-a11y/alt-text */
'use client';

import { useEffect, useState } from 'react';
import { articleApi, couturierApi, Article, CouturierProfile } from '@/lib/api';
import { normalizePhotoUrl } from '@/lib/utils';
import { Plus, Trash2, Edit, Image, Loader2, X, AlertCircle, Camera } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'ROBE', label: 'Robe' },
  { value: 'JUPE', label: 'Jupe' },
  { value: 'PANTALON', label: 'Pantalons' },
  { value: 'CHEMISE', label: 'Chemise' },
  { value: 'TENU_TRADITIONNELLE', label: 'Tenue traditionnelle' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function CouturierRealisationsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [profil, setProfil] = useState<CouturierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: 'AUTRE',
    prix: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setSelectedImages(prev => [...prev, ...newFiles]);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const fetchData = async () => {
    try {
      const profilRes = await couturierApi.getMyProfile();
      setProfil(profilRes.couturier);
      const articlesRes = await articleApi.getMyArticles();
      setArticles(articlesRes.articles || []);
    } catch (err: unknown) {
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.append('titre', formData.titre);
      fd.append('description', formData.description);
      fd.append('categorie', formData.categorie);
      fd.append('prix', formData.prix || '0');
      
      selectedImages.forEach(image => {
        fd.append('photos', image);
      });

      if (editingArticle) {
        await articleApi.update(editingArticle._id, fd);
        setSuccess('Réalisation mise à jour avec succès!');
      } else {
        await articleApi.create(fd);
        setSuccess('Réalisation ajoutée avec succès!');
      }

      resetForm();
      const articlesRes = await articleApi.getMyArticles();
      setArticles(articlesRes.articles || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Supprimer cette réalisation ?')) return;

    try {
      await articleApi.delete(articleId);
      setArticles(articles.filter(a => a._id !== articleId));
      setSuccess('Réalisation supprimée!');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      titre: article.titre,
      description: article.description,
      categorie: article.categorie,
      prix: article.prix?.toString() || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ titre: '', description: '', categorie: 'AUTRE', prix: '' });
    setSelectedImages([]);
    setPreviews([]);
    setEditingArticle(null);
    setShowForm(false);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-[#2D6A4F]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] animate-pulse">Chargement de votre catalogue...</p>
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500">
          <AlertCircle size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Profil Incomplet</h2>
          <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2">Vous devez d&apos;abord créer votre profil de couturier pour ajouter des réalisations.</p>
        </div>
        <Link href="/dashboard/couturier/settings">
          <button className="px-10 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-105 active:scale-95 transition-all">
            Créer mon profil
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Mes Réalisations
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Valorisez votre savoir-faire et vos créations
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={18} />
          Nouvelle création
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in duration-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in duration-300">
          <Loader2 size={16} className="text-green-500" />
          {success}
        </div>
      )}

      {/* Form Modal Premium */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h2 className="text-2xl font-black text-[#2D6A4F] tracking-tight">
                    {editingArticle ? 'Modifier la création' : 'Nouvelle création'}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Détails de votre réalisation</p>
               </div>
               <button onClick={resetForm} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Titre du modèle *</label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                      placeholder="Ex: Robe de mariée soyeuse"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Catégorie</label>
                    <select
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estimation Prix (FCFA)</label>
                    <input
                      type="number"
                      value={formData.prix}
                      onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                      placeholder="Prix indicatif"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all resize-none"
                      placeholder="Matériaux, temps de confection..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Photos du modèle</label>
                    <div className="flex flex-wrap gap-3">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-2xl overflow-hidden group shadow-lg">
                          <img src={preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#2D6A4F] hover:bg-white transition-all">
                        <Plus size={20} className="text-gray-400" />
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-5 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#2D6A4F]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : (editingArticle ? 'Enregistrer les modifications' : 'Publier la réalisation')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles Grid Premium */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] p-24 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
             <Camera size={48} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">Catalogue vide</h2>
             <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto mt-2">Commencez à ajouter vos plus belles créations pour attirer de nouveaux clients.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {articles.map((article) => (
            <div
              key={article._id}
              className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative h-64 bg-[#F5EFE6] overflow-hidden">
                {article.photos?.[0] ? (
                  <img
                    src={normalizePhotoUrl(article.photos[0].url)}
                    alt={article.titre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                     <Image size={48} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                   <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest rounded-full shadow-lg">
                      {CATEGORIES.find(c => c.value === article.categorie)?.label || article.categorie}
                   </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="text-sm font-black text-[#2D6A4F] uppercase tracking-tight line-clamp-1">{article.titre}</h3>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(article)}
                      className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#2D6A4F] hover:text-white transition-all shadow-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 font-bold leading-relaxed line-clamp-2 mb-6">
                  {article.description || 'Pas de description détaillée.'}
                </p>

                <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Estimation</span>
                     <span className="text-lg font-black text-[#2D6A4F] tracking-tight">
                        {article.prix > 0 ? `${article.prix.toLocaleString()} FCFA` : 'Sur devis'}
                     </span>
                  </div>
                  <Link href={`/dashboard/couturier/realisations/${article._id}`} className="text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                    Aperçu →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
