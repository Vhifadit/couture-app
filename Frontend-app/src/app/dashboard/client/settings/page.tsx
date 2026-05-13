'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Loader2, LogOut, AlertCircle, CheckCircle, Phone, Trash2 } from 'lucide-react';
import { clientApi, authApi, ClientProfile } from '@/lib/api';
import { normalizePhotoUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Client profile data
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Name editing
  const [name, setName] = useState(user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Email editing
  const [email, setEmail] = useState(user?.email || "");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  // Phone editing
  const [telephone, setTelephone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

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

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileRes = await clientApi.getMyProfile().catch(() => ({ client: null }));
        
        if (profileRes.client) {
          setClientProfile(profileRes.client);
          setTelephone(profileRes.client.telephone || "");
        }
      } catch {
        console.error("Erreur lors du chargement du profil");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append('photo', file);

      await authApi.uploadPhoto(formData);
      
      // Refetch full profile to get updated data

      const profileRes = await clientApi.getMyProfile();
      setClientProfile(profileRes.client);
      
      setSuccess("Photo mise à jour avec succès");
    } catch (error: unknown) {
      console.error('Photo upload error:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      const message = errorObj.response?.data?.message || 'Erreur lors de la mise à jour de la photo';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer votre photo de profil ?")) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await authApi.deletePhoto();
      
      const profileRes = await clientApi.getMyProfile();
      setClientProfile(profileRes.client);
      
      setSuccess("Photo supprimée avec succès");
      window.dispatchEvent(new CustomEvent('profileUpdate'));
    } catch (error: unknown) {
      console.error('Photo delete error:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      const message = errorObj.response?.data?.message || 'Erreur lors de la suppression de la photo';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameUpdate = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await authApi.updateProfile({ name });
      setSuccess("Nom mis à jour avec succès");
      setIsEditingName(false);
    } catch (error: unknown) {
      console.error('Name update error:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      const message = errorObj.response?.data?.message || 'Erreur lors de la mise à jour du nom';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await authApi.updateProfile({ email });
      setSuccess("Email mis à jour avec succès");
      setIsEditingEmail(false);
    } catch {
      setError("Erreur lors de la mise à jour de l'email");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneUpdate = async () => {
    const normalizedPhone = telephone.replace(/\s/g, '');
    if (!normalizedPhone.match(/^01\d{8}$/)) {
      setError("Format invalide : le numero doit commencer par 01 et contenir 10 chiffres");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await clientApi.updateProfile({ telephone: normalizedPhone });
      setSuccess("Téléphone mis à jour avec succès");
      setIsEditingPhone(false);
      setTelephone(normalizedPhone);
      setClientProfile((prev) => prev ? { ...prev, telephone: normalizedPhone } : prev);
    } catch (err: unknown) {
      console.error("Phone update error:", err);
      setError("Erreur lors de la mise à jour du téléphone");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle security password update
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

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

  return (
    <>
      <div className="flex flex-col gap-10">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
              Réglages
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Gérez vos informations personnelles
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle size={16} />
            {success}
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
                Mon Profil
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
            {isLoading ? (
              <div className="flex items-center justify-center p-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <Loader2 className="h-10 w-10 animate-spin text-[#2D6A4F]" />
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] p-10">
                {activeTab === 'profile' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div>
                      <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Informations personnelles</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Éditez votre identité publique</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-[#2D6A4F] flex items-center justify-center text-white text-4xl font-black overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                          {clientProfile?.photo ? (
                            <img src={normalizePhotoUrl(clientProfile.photo)} alt="Photo de profil" className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem] backdrop-blur-sm pointer-events-none">
                           <User size={24} className="text-white animate-bounce" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-4 items-center md:items-start">
                        <div className="flex gap-3">
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handlePhotoChange}
                          />
                          <label
                            htmlFor="photo-upload"
                            className="px-8 py-3 bg-[#2D6A4F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1B4332] cursor-pointer shadow-xl shadow-[#2D6A4F]/20 transition-all active:scale-95"
                          >
                            Changer la photo
                          </label>
                          {clientProfile?.photo && (
                            <button
                              type="button"
                              onClick={handlePhotoDelete}
                              disabled={isSaving}
                              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">JPG, PNG ou GIF. Max 5MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nom complet</label>
                        <div className="relative group">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditingName}
                            className="w-full pl-12 pr-28 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all disabled:opacity-50"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-gray-50/95 px-2 py-1">
                            {!isEditingName ? (
                              <button type="button" onClick={() => setIsEditingName(true)} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                Modifier
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button type="button" onClick={handleNameUpdate} disabled={isSaving} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                  OK
                                </button>
                                <button type="button" onClick={() => { setIsEditingName(false); setName(user?.name || ""); }} className="text-[9px] font-black uppercase text-gray-400 hover:underline">
                                  X
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email de contact</label>
                        <div className="relative group">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditingEmail}
                            className="w-full pl-12 pr-28 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all disabled:opacity-50"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-gray-50/95 px-2 py-1">
                            {!isEditingEmail ? (
                              <button type="button" onClick={() => setIsEditingEmail(true)} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                Modifier
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button type="button" onClick={handleEmailUpdate} disabled={isSaving} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                  OK
                                </button>
                                <button type="button" onClick={() => { setIsEditingEmail(false); setEmail(user?.email || ""); }} className="text-[9px] font-black uppercase text-gray-400 hover:underline">
                                  X
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Téléphone (Bénin)</label>
                        <div className="relative group">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                          <input
                            id="phone"
                            type="tel"
                            value={telephone}
                            onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            disabled={!isEditingPhone}
                            placeholder="01XXXXXXXX"
                            inputMode="numeric"
                            maxLength={10}
                            className="w-full pl-12 pr-28 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:bg-white transition-all disabled:opacity-50"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-gray-50/95 px-2 py-1">
                            {!isEditingPhone ? (
                              <button type="button" onClick={() => setIsEditingPhone(true)} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                Modifier
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button type="button" onClick={handlePhoneUpdate} disabled={isSaving} className="text-[9px] font-black uppercase text-[#2D6A4F] hover:underline">
                                  OK
                                </button>
                                <button type="button" onClick={() => { setIsEditingPhone(false); setTelephone(clientProfile?.telephone || ""); }} className="text-[9px] font-black uppercase text-gray-400 hover:underline">
                                  X
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div>
                      <h2 className="text-xl font-black text-[#2D6A4F] tracking-tight">Sécurité</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Protégez votre compte</p>
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
}
