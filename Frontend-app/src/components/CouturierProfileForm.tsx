'use client';
// src/components/CouturierProfileForm.tsx

import React, { useState, useEffect, useRef } from 'react';
import { LocateFixed, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { couturierApi, CouturierProfile } from '../lib/api';
import { normalizePhotoUrl } from '../lib/utils';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as React.ComponentType<any>;
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false }) as React.ComponentType<any>;
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false }) as React.ComponentType<any>;
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes par défaut de Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}


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
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom_marque: '',
    description: '',
    telephone: '',
    adresse: { rue: '', ville: '', quartier: '' },
    localisation: { longitude: '', latitude: '' },
    contacts: { email: '', whatsapp: '', site_web: '' },
    disponibilite_statut: 'DISPONIBLE' as 'DISPONIBLE' | 'OCCUPE' | 'ABSENT',
    max_commandes_en_cours: '5',
    services: [] as string[],
    tarifs: {
      retouche: '',
      creation_sur_mesure: '',
      confection: '',
    },
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.photo ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deletePhotoLoading, setDeletePhotoLoading] = useState(false);

  // Flag pour éviter d'écraser la preview juste après upload
  const justUploadedPhotoUrl = useRef<string | null>(null);


  const getMainPhotoId = () => {
    const photos = initialProfile?.photos ?? [];

    // Priorité 1: flag est_principale
    const main = photos.find((p) => p?.est_principale);
    if (main?._id) return main._id;

    // Priorité 2: si le backend ne renvoie pas est_principale, on essaie de match par URL
    const mainUrl =
      typeof initialProfile?.photo === 'string'
        ? initialProfile.photo
        : typeof avatarPreview === 'string'
          ? avatarPreview
          : null;

    if (mainUrl) {
      const byUrl = photos.find((p) => p?.url === mainUrl);
      if (byUrl?._id) return byUrl._id;
    }

    // Priorité 3: si on a des photos, on prend la première
    if (photos.length > 0 && photos[0]?._id) return photos[0]._id;

    return null;
  };

  const getAvatarInitials = () => {
    // Priorité 1: Nom de la marque
    const marque = initialProfile?.nom_marque || formData.nom_marque;
    if (marque) {
      return marque.trim()[0].toUpperCase();
    }
    // Priorité 2: Nom de l'utilisateur
    if (user?.name) {
      return user.name.trim()[0].toUpperCase();
    }
    // Fallback
    return 'C';
  };

  useEffect(() => {
    // Si un upload vient d'être fait, ne pas écraser la preview tant que le backend
    // n'a pas renvoyé la nouvelle URL.
    if (justUploadedPhotoUrl.current) {
      if (typeof initialProfile?.photo === 'string' && initialProfile.photo) {
        setAvatarPreview(initialProfile.photo);
        justUploadedPhotoUrl.current = null;
      } else {
        setAvatarPreview(justUploadedPhotoUrl.current);
      }
      setAvatarFile(null);
      return;
    }

    // Comportement normal: synchronisation avec initialProfile
    if (typeof initialProfile?.photo === 'string' && initialProfile.photo) {
      setAvatarPreview(initialProfile.photo);
      setAvatarFile(null);
    } else {
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [initialProfile]);



  useEffect(() => {
    return () => {
      if (avatarPreview && avatarFile) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {
          // ignore
        }
      }
    };
  }, [avatarPreview, avatarFile]);

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(initialProfile?.photo ?? null);
      return;
    }
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);

    // Upload automatique
    handleAvatarSubmit(file);
  };




  const [isLoading, setIsLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  const handleAvatarSubmit = async (fileToUpload?: File) => {
    const file = fileToUpload || avatarFile;
    if (!file) return;

    try {
      setAvatarUploading(true);
      setPhotoError(null);
      setPhotoSuccess(null);

      const fd = new FormData();
      fd.append('photo', file);
      
      // Ajouter les infos du profil si elles sont déjà saisies
      if (formData.nom_marque) fd.append('nom_marque', formData.nom_marque);
      if (formData.telephone) fd.append('telephone', formData.telephone);
      if (formData.adresse.ville) fd.append('ville', formData.adresse.ville);
      if (formData.adresse.quartier) fd.append('quartier', formData.adresse.quartier);

      const res = await couturierApi.uploadProfilePhoto(fd);

      setPhotoSuccess(res?.message ?? 'Photo de profil mise à jour');
      setAvatarFile(null);
      if (res?.couturier?.photo) {
        setAvatarPreview(res.couturier.photo);
        justUploadedPhotoUrl.current = res.couturier.photo;
      }

      onProfileUpdate();
      window.dispatchEvent(new CustomEvent('profileUpdate'));

    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Impossible de mettre à jour la photo.');
    } finally {
      setAvatarUploading(false);
    }
  };


  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const isInitialized = useRef(false);


  useEffect(() => {
    if (initialProfile && !isInitialized.current) {
      setFormData({
        nom_marque: initialProfile.nom_marque || '',
        description: initialProfile.description || '',
        telephone: initialProfile.telephone || '',
        adresse: {
          rue: initialProfile.adresse?.rue || '',
          ville: initialProfile.adresse?.ville || '',
          quartier: initialProfile.adresse?.quartier || '',
        },
        localisation: {
          longitude: initialProfile.localisation?.coordinates?.[0]?.toString() || '',
          latitude: initialProfile.localisation?.coordinates?.[1]?.toString() || '',
        },
        contacts: {
          email: initialProfile.contacts?.email || '',
          whatsapp: initialProfile.contacts?.whatsapp || '',
          site_web: initialProfile.contacts?.site_web || '',
        },
        disponibilite_statut: initialProfile.disponibilite_statut || (initialProfile.disponibilite ? 'DISPONIBLE' : 'ABSENT'),
        max_commandes_en_cours: initialProfile.max_commandes_en_cours?.toString() || '5',
        services: initialProfile.services || [],
        tarifs: {
          retouche: initialProfile.tarifs?.retouche?.toString() || '',
          creation_sur_mesure: initialProfile.tarifs?.creation_sur_mesure?.toString() || '',
          confection: initialProfile.tarifs?.confection?.toString() || '',
        },
      });
      isInitialized.current = true;
    }
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Retirer le badge auto si modification manuelle
    if (['ville', 'quartier', 'rue', 'latitude', 'longitude'].includes(name as string)) {
      setAutoFilled(prev => prev.filter(field => field !== name));
    }

    if (name === 'rue' || name === 'ville' || name === 'quartier') {
      setFormData(prev => ({
        ...prev,
        adresse: { ...prev.adresse, [name]: value },
      }));
    } else if (name === 'longitude' || name === 'latitude') {
      setFormData(prev => ({
        ...prev,
        localisation: { ...prev.localisation, [name]: value },
      }));
    } else if (name === 'email' || name === 'whatsapp' || name === 'site_web') {
      setFormData(prev => ({
        ...prev,
        contacts: { ...prev.contacts, [name]: value },
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

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setAutoFilled([]);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // Mettre à jour lat/lng immédiatement
      setFormData(prev => ({
        ...prev,
        localisation: {
          ...prev.localisation,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }
      }));

      try {
        // Reverse geocoding avec Nominatim (gratuit)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
        );
        const data = await res.json();
        const addr = data.address || {};

        // Mapper les champs
        const updates: Record<string, unknown> = {};

        if (addr.city || addr.town || addr.village) {
          updates.adresse = { ...formData.adresse, ville: addr.city || addr.town || addr.village };
          setAutoFilled(prev => [...prev, 'ville']);
        }
        if (addr.suburb || addr.neighbourhood || addr.quarter) {
          updates.adresse = { ...updates.adresse || formData.adresse, quartier: addr.suburb || addr.neighbourhood || addr.quarter };
          setAutoFilled(prev => [...prev, 'quartier']);
        }
        if (addr.road) {
          updates.adresse = { ...updates.adresse || formData.adresse, rue: addr.road };
          setAutoFilled(prev => [...prev, 'rue']);
        }
        updates.localisation = {
          ...formData.localisation,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        };
        setAutoFilled(prev => [...prev, 'latitude', 'longitude']);

        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      } catch (err) {
        console.warn("Erreur reverse geocoding:", err);
        // Lat/lng restent remplis même si reverse geocoding échoue
      } finally {
        setGeoLoading(false);
      }
    }, (err) => {
      let message = "Impossible d'accéder à votre position.";
      if (err.code === 1) message = "Veuillez autoriser la géolocalisation.";
      else if (err.code === 2) message = "Position indisponible.";
      else if (err.code === 3) message = "Timeout de géolocalisation.";

      setGeoError(message);
      setGeoLoading(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
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
        contacts: formData.contacts,
        disponibilite_statut: formData.disponibilite_statut,
        max_commandes_en_cours: parseInt(formData.max_commandes_en_cours) || 5,
        localisation: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(formData.localisation.longitude) || 0,
            parseFloat(formData.localisation.latitude) || 0,
          ] as [number, number],
        },
        services: formData.services,
        tarifs: {
          retouche: formData.tarifs.retouche ? parseInt(formData.tarifs.retouche) : undefined,
          creation_sur_mesure: formData.tarifs.creation_sur_mesure ? parseInt(formData.tarifs.creation_sur_mesure) : undefined,
          confection: formData.tarifs.confection ? parseInt(formData.tarifs.confection) : undefined,
        },
      };

      if (initialProfile) {
        await couturierApi.updateProfile(submitData);
        setSuccess('Profil mis à jour avec succès!');
      } else {
        await couturierApi.createProfile(submitData);
        setSuccess('Profil créé avec succès!');
      }
      onProfileUpdate();
      window.dispatchEvent(new CustomEvent('profileUpdate'));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 font-sans bg-white">
      <h3 className="text-xl font-semibold mb-4 text-[#2D6A4F]">
        {initialProfile ? 'Modifier vos informations' : 'Créer votre profil'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Photo de profil */}
        <div className="flex items-center gap-4">
          <div className="relative w-30 h-30 rounded-full overflow-hidden border border-[#C9B99A] bg-[#F5EFE6] flex items-center justify-center shrink-0">
            {avatarPreview ? (
              <img src={normalizePhotoUrl(avatarPreview)} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#2D6A4F] font-semibold">
                {getAvatarInitials()}
              </span>
            )}
          </div>


          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
            <div className="flex items-center gap-3">
              <input
                id="photo_profile"
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />

              <label
                htmlFor="photo_profile"
                className="px-4 py-2 rounded-md border border-[#C9B99A] bg-white text-[#2D6A4F] text-sm font-medium hover:bg-[#F5EFE6] cursor-pointer transition-colors disabled:opacity-60"
              >
                {avatarUploading ? 'Envoi...' : 'Choisir un fichier'}
              </label>

              {avatarPreview && !avatarFile && (
                <button
                  type="button"
                  onClick={async () => {
                    const photoId = getMainPhotoId();
                    if (!photoId) {
                      setPhotoError('Photo de profil introuvable.');
                      return;
                    }
                    if (!confirm("Voulez-vous vraiment supprimer votre photo de profil ?")) return;

                    try {
                      setDeletePhotoLoading(true);
                      setPhotoError(null);
                      setPhotoSuccess(null);

                      await couturierApi.deletePhoto(photoId);
                      setAvatarPreview(null);
                      setAvatarFile(null);
                      onProfileUpdate();
                      window.dispatchEvent(new CustomEvent('profileUpdate'));
                      setPhotoSuccess("Photo de profil supprimée");
                    } catch (err) {
                      setPhotoError(err instanceof Error ? err.message : 'Impossible de supprimer la photo.');
                    } finally {
                      setDeletePhotoLoading(false);
                    }
                  }}
                  disabled={deletePhotoLoading}
                  className="p-2 rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Supprimer la photo"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            {photoError && <p className="text-red-600 text-sm mt-2">{photoError}</p>}
            {photoSuccess && <p className="text-green-600 text-sm mt-2">{photoSuccess}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="nom_marque" className="block text-sm font-medium text-gray-700 mb-1">Nom de la marque</label>

          <input
            id="nom_marque"
            name="nom_marque"
            type="text"
            value={formData.nom_marque}
            onChange={handleChange}
            required
            className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
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
            className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            value={formData.telephone}
            onChange={handleChange}
            required
            className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>
        <fieldset className="border border-[#C9B99A] p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-[#2D6A4F]">Adresse</legend>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                id="ville"
                name="ville"
                type="text"
                value={formData.adresse.ville}
                onChange={handleChange}
                required
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] ${autoFilled.includes('ville') ? 'border-green-500 bg-green-50' : 'border-[#C9B99A]'
                  }`}
              />
              {autoFilled.includes('ville') && (
                <span className="absolute right-2 top-9 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  auto
                </span>
              )}
            </div>
            <div className="relative">
              <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
              <input
                id="quartier"
                name="quartier"
                type="text"
                value={formData.adresse.quartier}
                onChange={handleChange}
                required
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] ${autoFilled.includes('quartier') ? 'border-green-500 bg-green-50' : 'border-[#C9B99A]'
                  }`}
              />
              {autoFilled.includes('quartier') && (
                <span className="absolute right-2 top-9 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  auto
                </span>
              )}
            </div>
            <div className="relative">
              <label htmlFor="rue" className="block text-sm font-medium text-gray-700 mb-1">Rue / Précisions</label>
              <input
                id="rue"
                name="rue"
                type="text"
                value={formData.adresse.rue}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] ${autoFilled.includes('rue') ? 'border-green-500 bg-green-50' : 'border-[#C9B99A]'
                  }`}
              />
              {autoFilled.includes('rue') && (
                <span className="absolute right-2 top-9 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  auto
                </span>
              )}
            </div>

            {/* Bouton détection position */}
            <div className="pt-2">
              <button
                type="button"
                onClick={detectLocation}
                disabled={geoLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white text-sm rounded-md hover:bg-[#1B4332] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {geoLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Détection...
                  </>
                ) : (
                  <>
                    <LocateFixed size={16} />
                    Détecter ma position
                  </>
                )}
              </button>
            </div>

            {geoError && (
              <p className="text-red-600 text-sm mt-1">{geoError}</p>
            )}
          </div>
        </fieldset>

        <fieldset className="border border-[#C9B99A] p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-[#2D6A4F]">Coordonnées atelier</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.localisation.longitude}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] ${autoFilled.includes('longitude') ? 'border-green-500 bg-green-50' : 'border-[#C9B99A]'
                  }`}
              />
              {autoFilled.includes('longitude') && (
                <span className="absolute right-2 top-9 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  auto
                </span>
              )}
            </div>
            <div className="relative">
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.localisation.latitude}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] ${autoFilled.includes('latitude') ? 'border-green-500 bg-green-50' : 'border-[#C9B99A]'
                  }`}
              />
              {autoFilled.includes('latitude') && (
                <span className="absolute right-2 top-9 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  auto
                </span>
              )}
            </div>
            
            {/* Carte Interactive pour sélection précise */}
            <div className="col-span-full mt-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 italic">
                Ou cliquez sur la carte pour définir l'emplacement exact de votre atelier :
              </label>
              <div className="h-64 rounded-xl border border-[#C9B99A] overflow-hidden z-0 shadow-inner bg-gray-50">
                <MapContainer
                  center={
                    formData.localisation.latitude && formData.localisation.longitude 
                      ? [parseFloat(formData.localisation.latitude), parseFloat(formData.localisation.longitude)] 
                      : [6.35, 2.44]
                  }
                  zoom={formData.localisation.latitude ? 16 : 12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                  />
                  <LocationMarker 
                    position={
                      formData.localisation.latitude && formData.localisation.longitude 
                        ? [parseFloat(formData.localisation.latitude), parseFloat(formData.localisation.longitude)] 
                        : null
                    }
                    setPosition={([lat, lng]) => {
                      setFormData(prev => ({
                        ...prev,
                        localisation: { latitude: lat.toString(), longitude: lng.toString() }
                      }));
                    }}
                  />
                </MapContainer>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email contact</label>
              <input id="email" name="email" type="email" value={formData.contacts.email} onChange={handleChange} className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]" />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input id="whatsapp" name="whatsapp" type="tel" value={formData.contacts.whatsapp} onChange={handleChange} className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]" />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-[#C9B99A] p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-[#2D6A4F]">Disponibilite</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disponibilite_statut" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                id="disponibilite_statut"
                name="disponibilite_statut"
                value={formData.disponibilite_statut}
                onChange={(e) => setFormData(prev => ({ ...prev, disponibilite_statut: e.target.value as 'DISPONIBLE' | 'OCCUPE' | 'ABSENT' }))}
                className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
              >
                <option value="DISPONIBLE">Disponible</option>
                <option value="OCCUPE">Occupé</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
            <div>
              <label htmlFor="max_commandes_en_cours" className="block text-sm font-medium text-gray-700 mb-1">Limite commandes en cours</label>
              <input id="max_commandes_en_cours" name="max_commandes_en_cours" type="number" min="1" value={formData.max_commandes_en_cours} onChange={handleChange} className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]" />
            </div>
          </div>
        </fieldset>

        {/* Services */}
        <fieldset className="border border-[#C9B99A] p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-[#2D6A4F]">Services proposés</legend>
          <div className="flex flex-wrap gap-3 mt-2">
            {SERVICE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.services.includes(option.value)}
                  onChange={() => handleServiceChange(option.value)}
                  className="w-4 h-4 text-[#2D6A4F] border-[#C9B99A] rounded focus:ring-[#2D6A4F]"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Tarifs */}
        <fieldset className="border border-[#C9B99A] p-4 rounded-md">
          <legend className="px-2 text-sm font-medium text-[#2D6A4F]">Tarifs (FCFA)</legend>
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
                className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
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
                className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
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
                className="w-full p-2 border border-[#C9B99A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 self-start bg-[#2D6A4F] text-white rounded-md hover:bg-[#1B4332] transition-colors disabled:opacity-50"
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
