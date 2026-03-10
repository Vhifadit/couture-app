'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { couturierApi, CouturierProfile, authApi } from '@/lib/api';
import CouturierPhotoManager from '@/components/CouturierPhotoManager';
import CouturierProfileForm from '@/components/CouturierProfileForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User, Lock, Bell, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const CouturierSettingsPage = () => {
  const [profile, setProfile] = useState<CouturierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    router.push('/');
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // useCallback pour eviter de recreer la fonction a chaque rendu
  const fetchProfile = useCallback(async () => {
    try {
      // Ne pas afficher le chargement pour les rafraichissements pour eviter le clignotement
      // setLoading(true); 
      const response = await couturierApi.getMyProfile();
      setProfile(response.couturier);
      setError(null);
    } catch (err: unknown) {
      // Si 404, c'est normal - le profil n'existe pas encore
      const errorObj = err as { response?: { status?: number } };
      if (errorObj.response?.status === 404) {
        setError(null);
        setProfile(null);
      } else {
        setError(err instanceof Error ? err.message : "Impossible de charger le profil.");
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle security password update
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setSecurityError('Le nouveau mot de passe doit être différent du mot de passe actuel');
      return;
    }

    setIsSecurityLoading(true);

    try {
      await authApi.updatePassword({
        currentPassword,
        newPassword,
      });
      
      setSecuritySuccess('Mot de passe mis à jour avec succès');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const message = errorObj.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe';
      setSecurityError(message);
    } finally {
      setIsSecurityLoading(false);
    }
  };

  if (loading) {
    return <div className="p-5">Chargement du profil...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-600">Erreur : {error}</div>;
  }

  if (!profile) {
    // Afficher un message avec un bouton pour créer le profil
    return (
      <div className="max-w-4xl mx-auto p-5">
        <h1 className="text-2xl font-bold mb-6">Créer mon profil de couturier</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Vous n&apos;avez pas encore créé votre profil. Créez-le pour commencer à recevoir des commandes.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg">
          <CouturierProfileForm initialProfile={null} onProfileUpdate={fetchProfile} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-5">
        <h1 className="text-2xl font-bold mb-6">Gérer mon profil de couturier</h1>
        
        {/* Navigation par onglets */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User size={16} className="inline mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'photos'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bell size={16} className="inline mr-2" />
            Photos
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Lock size={16} className="inline mr-2" />
            Sécurité
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto"
          >
            <LogOut size={16} className="inline mr-2" />
            Déconnexion
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'profile' && (
          <div className="border border-gray-200 rounded-lg mb-8">
            {/* Photo de profil en haut */}
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Photo de profil</h3>
              <div className="flex items-center gap-6">
                {/* Avatar actuel */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shrink-0 bg-[#A08060]">
                  {profile.photos?.find(p => p.est_principale)?.url ? (
                    <img 
                      src={profile.photos.find(p => p.est_principale)?.url} 
                      alt={profile.nom_marque}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    profile.nom_marque?.[0] || "C"
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {profile.photos?.find(p => p.est_principale) 
                      ? "Ceci est votre photo de profil actuelle" 
                      : "Vous n'avez pas de photo de profil"}
                  </p>
                  <button
                    onClick={() => setActiveTab('photos')}
                    className="px-4 py-2 bg-[#2D6A4F] text-white rounded-md text-sm hover:bg-[#1B4332] transition-colors"
                  >
                    {profile.photos?.length > 0 ? "Changer la photo" : "Ajouter une photo"}
                  </button>
                </div>
              </div>
            </div>
            
            <CouturierProfileForm initialProfile={profile} onProfileUpdate={fetchProfile} />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="border border-gray-200 rounded-lg">
            <CouturierPhotoManager initialPhotos={profile.photos || []} onDataChange={fetchProfile} />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4">Sécurité</h2>
            <p className="text-gray-600 mb-6">Gérez vos paramètres de sécurité ici.</p>

            {/* Messages d'erreur et de succès */}
            {securityError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {securitySuccess}
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSecurityLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-[#2D6A4F] text-white rounded-md font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-70"
                >
                  {isSecurityLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Mettre à jour le mot de passe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal de confirmation de deconnexion */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Déconnexion
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sur de vouloir vous déconnecter ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Non
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CouturierSettingsPage;

