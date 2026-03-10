/* eslint-disable jsx-a11y/alt-text */
'use client';

import { useEffect, useState } from 'react';
import { articleApi, couturierApi, Article, CouturierProfile } from '@/lib/api';
import { Plus, Trash2, Edit, Image, Loader2 } from 'lucide-react';
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

  const fetchData = async () => {
    try {
      // Get profile
      const profilRes = await couturierApi.getMyProfile();
      setProfil(profilRes.couturier);

      // Get articles
      const articlesRes = await articleApi.getMyArticles();
      setArticles(articlesRes.articles || []);
    } catch (_err) {
      console.error('Erreur:', _err);
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
      const articleData = {
        titre: formData.titre,
        description: formData.description,
        categorie: formData.categorie,
        prix: formData.prix ? parseInt(formData.prix) : 0,
      };

      if (editingArticle) {
        await articleApi.update(editingArticle._id, articleData);
        setSuccess('Réalisation mise à jour avec succès!');
      } else {
        await articleApi.create(articleData);
        setSuccess('Réalisation ajoutée avec succès!');
      }

      // Reset form
      setFormData({ titre: '', description: '', categorie: 'AUTRE', prix: '' });
      setShowForm(false);
      setEditingArticle(null);

      // Refresh articles
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réalisation?')) return;

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
    setEditingArticle(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#2D6A4F]" size={32} />
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Vous devez d&apos;abord créer votre profil de couturier.
          </p>
          <Link href="/dashboard/couturier/settings" className="text-[#2D6A4F] underline font-medium">
            Créer mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D6A4F]">Mes Réalisations</h1>
          <p className="text-sm text-[#718096] mt-1">
            Gérez vos créations et réalisations pour les faire découvrir à vos clients
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] transition-colors"
        >
          <Plus size={18} />
          Ajouter une réalisation
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-4">
              {editingArticle ? 'Modifier la réalisation' : 'Nouvelle réalisation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent"
                  placeholder="Ex: Robe de mariée traditionnelle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent"
                  placeholder="Décrivez votre création..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  title="Sélectionner une catégorie"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent"
                  placeholder="Prix (optionnel)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] disabled:opacity-50 transition-colors"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {editingArticle ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Image size={48} className="mx-auto text-gray-300 mb-3" aria-hidden="true"/>
          <p className="text-gray-500">Vous n&apos;avez pas encore de réalisations</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajoutez vos créations pour les faire découvrir à vos clients
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white rounded-xl border border-[#C9B99A] overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image placeholder */}
              <div className="h-40 bg-[#C9B99A] flex items-center justify-center">
                {article.photos?.[0] ? (
                  <img
                    src={article.photos[0].url}
                    alt={article.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={32} className="text-white/50" aria-hidden="true" />
                )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#2D6A4F]">{article.titre}</h3>
                  <span className="text-xs px-2 py-1 bg-[#F5EFE6] text-[#718096] rounded-full">
                    {CATEGORIES.find(c => c.value === article.categorie)?.label || article.categorie}
                  </span>
                </div>

                <p className="text-sm text-[#718096] line-clamp-2 mb-3">
                  {article.description || 'Aucune description'}
                </p>

                <div className="flex justify-between items-center">
                  {article.prix > 0 && (
                    <span className="font-bold text-[#2D6A4F]">
                      {article.prix.toLocaleString()}FCFA
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(article)}
                      title="Modifier"
                      className="p-1.5 text-gray-500 hover:text-[#2D6A4F] hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      title="Supprimer"
                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

