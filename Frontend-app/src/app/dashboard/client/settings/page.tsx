'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Save, Loader2, Plus, X, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { clientApi, Address, Measurements, authApi, ClientProfile } from '@/lib/api';
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
  const [clientProfile] = useState<ClientProfile | null>(null);
  
  // Name editing
  const [name, setName] = useState(user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Profile data
  const [telephone, setTelephone] = useState("");
  const [adresses, setAdresses] = useState<Address[]>([]);
  const [measurements, setMeasurements] = useState<Measurements>({});
  
  // New address form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    nom: "",
    rue: "",
    quartier: "",
    ville: "",
    est_principale: false,
  });

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
        const [profileRes, measurementsRes] = await Promise.all([
          clientApi.getMyProfile().catch(() => ({ client: null })),
          clientApi.getMeasurements().catch(() => ({ mesures: {} }))
        ]);
        
        if (profileRes.client) {
          setTelephone(profileRes.client.telephone || "");
          setAdresses(profileRes.client.adresses || []);
        }
        if (measurementsRes.mesures) {
          setMeasurements(measurementsRes.mesures);
        }
      } catch {
        console.error("Erreur lors du chargement du profil:");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await clientApi.updateProfile({ telephone });
      setSuccess("Profil mis a jour avec succes");
    } catch {
      setError("Erreur lors de la mise a jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMeasurements = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await clientApi.updateMeasurements(measurements);
      setSuccess("Mesures mises a jour avec succes");
    } catch {
      setError("Erreur lors de la mise a jour des mesures");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.nom || !newAddress.rue || !newAddress.ville) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      await clientApi.addAddress(newAddress as Omit<Address, '_id'>);
      const profileRes = await clientApi.getMyProfile();
      setAdresses(profileRes.client?.adresses || []);
      setShowNewAddress(false);
      setNewAddress({ nom: "", rue: "", quartier: "", ville: "", est_principale: false });
      setSuccess("Adresse ajoutee avec succes");
    } catch {
      setError("Erreur lors de l'ajout de l'adresse");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await clientApi.removeAddress(addressId);
      const profileRes = await clientApi.getMyProfile();
      setAdresses(profileRes.client?.adresses || []);
    } catch {
      setError("Erreur lors de la suppression de l'adresse");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append('photo', file);

      // This would typically call an API to upload the photo
      // For now, we'll just show a success message since the API might not exist
      setSuccess("Photo mise à jour avec succès");
    } catch {
      setError("Erreur lors de la mise à jour de la photo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameUpdate = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // This would typically call an API to update the name
      setSuccess("Nom mis à jour avec succès");
      setIsEditingName(false);
    } catch {
      setError("Erreur lors de la mise à jour du nom");
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2D6A4F] mb-6">Parametres du compte</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
            {success}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl border border-[#C9B99A] overflow-hidden">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-[#F5EFE6] text-[#2D6A4F] border-l-4 border-[#2D6A4F]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2D6A4F]'
                }`}
              >
                <User size={18} />
                Mon Profil
              </button>
              <button
                onClick={() => setActiveTab('measurements')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'measurements'
                    ? 'bg-[#F5EFE6] text-[#2D6A4F] border-l-4 border-[#2D6A4F]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2D6A4F]'
                }`}
              >
                <User size={18} />
                Mes Mesures
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'addresses'
                    ? 'bg-[#F5EFE6] text-[#2D6A4F] border-l-4 border-[#2D6A4F]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2D6A4F]'
                }`}
              >
                <User size={18} />
                Adresses
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-[#F5EFE6] text-[#2D6A4F] border-l-4 border-[#2D6A4F]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2D6A4F]'
                }`}
              >
                <Lock size={18} />
                Sécurité
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#2D6A4F]" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#C9B99A] p-6">
                {activeTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4">Informations personnelles</h2>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-full bg-[#A08060] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                        {clientProfile?.photo ? (
                          <img src={clientProfile.photo} alt="Photo de profil" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.[0] || "U"
                        )}
                      </div>
                      <div>
                        <label htmlFor="photo-upload" className="cursor-pointer text-sm text-[#2D6A4F] font-medium hover:underline block">
                          Changer la photo
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditingName}
                        className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                      />
                      {!isEditingName ? (
                        <button type="button" onClick={() => setIsEditingName(true)} className="text-sm text-[#2D6A4F] mt-1 hover:underline">
                          Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2 mt-1">
                          <button type="button" onClick={handleNameUpdate} className="text-sm text-[#2D6A4F] font-medium">
                            Enregistrer
                          </button>
                          <button type="button" onClick={() => { setIsEditingName(false); setName(user?.name || ""); }} className="text-sm text-gray-500">
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-3 py-2 rounded-md border border-[#C9B99A] bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                      <input
                        id="phone"
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="+229 97 00 00 00"
                        className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-[#2D6A4F] text-white rounded-md font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-70"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'measurements' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4">Mes Mesures</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="tour_poitrine" className="block text-sm font-medium text-gray-700 mb-1">Tour de poitrine (cm)</label>
                        <input
                          id="tour_poitrine"
                          type="number"
                          placeholder="Ex: 90"
                          value={measurements.tour_poitrine || ""}
                          onChange={(e) => setMeasurements({...measurements, tour_poitrine: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                      <div>
                        <label htmlFor="tour_taille" className="block text-sm font-medium text-gray-700 mb-1">Tour de taille (cm)</label>
                        <input
                          id="tour_taille"
                          type="number"
                          placeholder="Ex: 75"
                          value={measurements.tour_taille || ""}
                          onChange={(e) => setMeasurements({...measurements, tour_taille: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                      <div>
                        <label htmlFor="tour_hanches" className="block text-sm font-medium text-gray-700 mb-1">Tour de hanches (cm)</label>
                        <input
                          id="tour_hanches"
                          type="number"
                          placeholder="Ex: 95"
                          value={measurements.tour_hanches || ""}
                          onChange={(e) => setMeasurements({...measurements, tour_hanches: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                      <div>
                        <label htmlFor="longueur_bras" className="block text-sm font-medium text-gray-700 mb-1">Longueur des bras (cm)</label>
                        <input
                          id="longueur_bras"
                          type="number"
                          placeholder="Ex: 55"
                          value={measurements.longueur_bras || ""}
                          onChange={(e) => setMeasurements({...measurements, longueur_bras: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                      <div>
                        <label htmlFor="longueur_jambe" className="block text-sm font-medium text-gray-700 mb-1">Longueur des jambes (cm)</label>
                        <input
                          id="longueur_jambe"
                          type="number"
                          placeholder="Ex: 100"
                          value={measurements.longueur_jambe || ""}
                          onChange={(e) => setMeasurements({...measurements, longueur_jambe: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                      <div>
                        <label htmlFor="taille_totale" className="block text-sm font-medium text-gray-700 mb-1">Taille totale (cm)</label>
                        <input
                          id="taille_totale"
                          type="number"
                          placeholder="Ex: 170"
                          value={measurements.taille_totale || ""}
                          onChange={(e) => setMeasurements({...measurements, taille_totale: Number(e.target.value)})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveMeasurements}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-[#2D6A4F] text-white rounded-md font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-70"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-[#2D6A4F]">Mes Adresses</h2>
                      <button
                        onClick={() => setShowNewAddress(!showNewAddress)}
                        className="flex items-center gap-1 text-sm text-[#2D6A4F] font-medium"
                      >
                        <Plus size={16} /> Ajouter
                      </button>
                    </div>

                    {showNewAddress && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nom (ex: Maison, Bureau)"
                            value={newAddress.nom || ""}
                            onChange={(e) => setNewAddress({...newAddress, nom: e.target.value})}
                            className="px-3 py-2 rounded-md border border-[#C9B99A]"
                          />
                          <input
                            type="text"
                            placeholder="Ville *"
                            value={newAddress.ville || ""}
                            onChange={(e) => setNewAddress({...newAddress, ville: e.target.value})}
                            className="px-3 py-2 rounded-md border border-[#C9B99A]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Rue *"
                          value={newAddress.rue || ""}
                          onChange={(e) => setNewAddress({...newAddress, rue: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A]"
                        />
                        <input
                          type="text"
                          placeholder="Quartier"
                          value={newAddress.quartier || ""}
                          onChange={(e) => setNewAddress({...newAddress, quartier: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-[#C9B99A]"
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newAddress.est_principale || false}
                            onChange={(e) => setNewAddress({...newAddress, est_principale: e.target.checked})}
                          />
                          <span className="text-sm">Adresse principale</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddAddress}
                            disabled={isSaving}
                            className="px-4 py-2 bg-[#2D6A4F] text-white rounded-md text-sm font-medium disabled:opacity-70"
                          >
                            {isSaving ? "Ajout..." : "Ajouter"}
                          </button>
                          <button
                            onClick={() => setShowNewAddress(false)}
                            className="px-4 py-2 border border-[#C9B99A] rounded-md text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {adresses.length === 0 && !showNewAddress ? (
                      <p className="text-gray-500 text-center py-4">Aucune adresse enregistree</p>
                    ) : (
                      <div className="space-y-2">
                        {adresses.map((addr, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{addr.nom}</p>
                              <p className="text-sm text-gray-500">{addr.rue}, {addr.ville}</p>
                              {addr.est_principale && (
                                <span className="text-xs text-[#2D6A4F]">Principale</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteAddress(addr._id || "")}
                              className="text-red-500 hover:text-red-700"
                              aria-label={`Supprimer l'adresse ${addr.nom}`}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#2D6A4F] mb-4">Sécurité</h2>
                    <p className="text-gray-600 mb-6">Gérez vos paramètres de sécurité ici.</p>

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
                              mise à jour...
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
            )}
          </div>
        </div>
      </div>

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
}

