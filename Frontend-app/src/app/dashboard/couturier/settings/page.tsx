'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { couturierApi, CouturierProfile, authApi } from '@/lib/api';
import CouturierProfileForm from '@/components/CouturierProfileForm';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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
    // Si on a déjà un profil, on ne montre pas l'écran de chargement complet
    // pour éviter de démonter les composants et perdre leur état interne.
    if (!profile) {
      setLoading(true);
    }
    
    try {
      const response = await couturierApi.getMyProfile();
      setProfile(response.couturier);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj.response?.status === 404) {
        setError(null);
        setProfile(null);
      } else {
        setError(err instanceof Error ? err.message : "Impossible de charger le profil.");
      }
    } finally {
      setLoading(false);
    }
  }, [profile]); // On ajoute profile en dépendance pour que la logique de loading soit correcte

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
            Vous n&apos;avez pas encore cr&eacute;&eacute; votre profil. Cr&eacute;ez-le pour commencer &agrave; recevoir des commandes.
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
      <div className="flex flex-col gap-10">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
              Mon Atelier
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Configurez votre espace de création
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Navigation Sidebar Premium */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] p-3 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-[#2D6A4F] text-white shadow-xl shadow-[#2D6A4F]/20 translate-x-1'
                    : 'text-gray-400 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]'
                }`}
              >
                <User size={18} />
                Profil Atelier
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'security'
                    ? 'bg-[#2D6A4F] text-white shadow-xl shadow-[#2D6A4F]/20 translate-x-1'
                    : 'text-gray-400 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]'
                }`}
              >
                <Lock size={18} />
                Sécurité
              </button>
              <div className="h-px bg-gray-50 mx-4 my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>

          <div className="flex-1">
            {!profile && activeTab === 'profile' ? (
              <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-amber-900 tracking-tight">Profil Non Configuré</h2>
                  <p className="text-sm text-amber-700 font-medium max-w-sm mx-auto mt-2">Votre atelier n&apos;est pas encore visible. Créez votre profil pour recevoir des commandes.</p>
                </div>
                <div className="w-full bg-white rounded-[2rem] border border-amber-100 p-2">
                  <CouturierProfileForm initialProfile={null} onProfileUpdate={fetchProfile} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] overflow-hidden">
                {activeTab === 'profile' && (
                  <div className="animate-in fade-in duration-500">
                     <div className="px-10 py-8 border-b border-gray-50">
                        <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Détails de l&apos;Atelier</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Présentation et services</p>
                     </div>
                     <div className="p-2 md:p-6 lg:p-10">
                        <CouturierProfileForm initialProfile={profile} onProfileUpdate={fetchProfile} />
                     </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-10 space-y-10 animate-in fade-in duration-500">
                    <div>
                      <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Sécurité</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gérez vos accès sécurisés</p>
                    </div>

                    {securityError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <AlertCircle size={16} />
                        {securityError}
                      </div>
                    )}
                    {securitySuccess && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <CheckCircle size={16} />
                        {securitySuccess}
                      </div>
                    )}

                    <form onSubmit={handleSecuritySubmit} className="space-y-8 max-w-md">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Mot de passe actuel</label>
                        <div className="relative group">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nouveau mot de passe</label>
                        <div className="relative group">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                            placeholder="Min. 6 caractères"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Confirmer le mot de passe</label>
                        <div className="relative group">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all"
                            placeholder="Confirmez à nouveau"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSecurityLoading}
                        className="w-full py-4 bg-[#2D6A4F] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2D6A4F]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                      >
                        {isSecurityLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Mise à jour...
                          </div>
                        ) : "Mettre à jour le mot de passe"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Déconnexion</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">Êtes-vous sûr de vouloir quitter votre session ?</p>
            <div className="flex gap-3">
              <button onClick={confirmLogout} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95">
                Oui
              </button>
              <button onClick={cancelLogout} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all">
                Non
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CouturierSettingsPage;
