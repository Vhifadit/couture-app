// src/components/CouturierProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { couturierApi, CouturierProfile } from '../lib/api';

interface CouturierProfileFormProps {
  initialProfile: CouturierProfile | null;
  onProfileUpdate: () => void;
}

const SERVICE_OPTIONS = [
  { value: 'RETOUCHE', label: 'Retouche' },
  { value: 'CREATION_SUR_MESURE', label: 'Création sur mesure' },
  { value: 'CONFECTION', label: 'Confection' },
  { value: 'AUTRE', label: 'Autre' },
];

const CouturierProfileForm: React.FC<CouturierProfileFormProps> = ({ initialProfile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    nom_marque: '',
    description: '',
    telephone: '',
    adresse: { rue: '', ville: '', quartier: '' },
    services: [] as string[],
    tarifs: {
      retouche: '',
      creation_sur_mesure: '',
      confection: '',
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        nom_marque: initialProfile.nom_marque || '',
        description: initialProfile.description || '',
        telephone: initialProfile.telephone || '',
        adresse: {
          rue: initialProfile.adresse?.rue || '',
          ville: initialProfile.adresse?.ville || '',
          quartier: initialProfile.adresse?.quartier || '',
        },
        services: initialProfile.services || [],
        tarifs: {
          retouche: initialProfile.tarifs?.retouche?.toString() || '',
          creation_sur_mesure: initialProfile.tarifs?.creation_sur_mesure?.toString() || '',
          confection: initialProfile.tarifs?.confection?.toString() || '',
        },
      });
    }
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'rue' || name === 'ville' || name === 'quartier') {
      setFormData(prev => ({
        ...prev,
        adresse: { ...prev.adresse, [name]: value },
      }));
    } else if (name === 'retouche' || name === 'creation_sur_mesure' || name === 'confection') {
      setFormData(prev => ({
        ...prev,
        tarifs: { ...prev.tarifs, [name]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (serviceValue: string) => {
    setFormData(prev => {
      const currentServices = prev.services;
      if (currentServices.includes(serviceValue)) {
        return {
          ...prev,
          services: currentServices.filter(s => s !== serviceValue),
        };
      } else {
        return {
          ...prev,
          services: [...currentServices, serviceValue],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Préparer les données avec conversion des tarifs en nombres
      const submitData = {
        nom_marque: formData.nom_marque,
        description: formData.description,
        telephone: formData.telephone,
        adresse: formData.adresse,
        services: formData.services,
        tarifs: {
          retouche: formData.tarifs.retouche ? parseInt(formData.tarifs.retouche) : undefined,
          creation_sur_mesure: formData.tarifs.creation_sur_mesure ? parseInt(formData.tarifs.creation_sur_mesure) : undefined,
          confection: formData.tarifs.confection ? parseInt(formData.tarifs.confection) : undefined,
        },
      };

      if (initialProfile) {
        await couturierApi.updateProfile(submitData);
        setSuccess('Profil mis a jour avec succes !');
      } else {
        await couturierApi.createProfile(submitData);
        setSuccess('Profil cree avec succes !');
      }
      onProfileUpdate();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 font-sans">
      <h3 className="text-xl font-semibold mb-4">
        {initialProfile ? 'Modifier vos informations' : 'Creer votre profil'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nom_marque" className="block text-sm font-medium text-gray-700 mb-1">Nom de la marque</label>
          <input 
            id="nom_marque" 
            name="nom_marque" 
            type="text" 
            value={formData.nom_marque} 
            onChange={handleChange} 
            required 
            className="w-full p-2 border border-gray-300 rounded-md" 
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={4} 
            className="w-full p-2 border border-gray-300 rounded-md" 
          />
        </div>
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
          <input 
            id="telephone" 
            name="telephone" 
            type="tel" 
            value={formData.telephone} 
            onChange={handleChange} 
            required 
            className="w-full p-2 border border-gray-300 rounded-md" 
          />
        </div>
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-gray-700">Adresse</legend>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input 
                id="ville" 
                name="ville" 
                type="text" 
                value={formData.adresse.ville} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
              <input 
                id="quartier" 
                name="quartier" 
                type="text" 
                value={formData.adresse.quartier} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="rue" className="block text-sm font-medium text-gray-700 mb-1">Rue / Previsions</label>
              <input 
                id="rue" 
                name="rue" 
                type="text" 
                value={formData.adresse.rue} 
                onChange={handleChange} 
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </fieldset>

        {/* Services */}
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-gray-700">Services proposés</legend>
          <div className="flex flex-wrap gap-3 mt-2">
            {SERVICE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.services.includes(option.value)}
                  onChange={() => handleServiceChange(option.value)}
                  className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Tarifs */}
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-gray-700">Tarifs (FCFA)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div>
              <label htmlFor="retouche" className="block text-sm text-gray-600 mb-1">Retouche</label>
              <input
                id="retouche"
                name="retouche"
                type="number"
                placeholder="Ex: 5000"
                value={formData.tarifs.retouche}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="creation_sur_mesure" className="block text-sm text-gray-600 mb-1">Création sur mesure</label>
              <input
                id="creation_sur_mesure"
                name="creation_sur_mesure"
                type="number"
                placeholder="Ex: 25000"
                value={formData.tarifs.creation_sur_mesure}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="confection" className="block text-sm text-gray-600 mb-1">Confection</label>
              <input
                id="confection"
                name="confection"
                type="number"
                placeholder="Ex: 15000"
                value={formData.tarifs.confection}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit" 
          disabled={isLoading} 
          className="px-5 py-2.5 self-start bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : initialProfile ? 'Enregistrer les modifications' : 'Creer le profil'}
        </button>
        {error && <p className="text-red-600">Erreur : {error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </form>
    </div>
  );
};

export default CouturierProfileForm;
