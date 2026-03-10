// Exemple de composant: src/components/CouturierPhotoUpload.tsx
import React, { useState, useEffect } from 'react';
import { couturierApi } from '../lib/api';

const CouturierPhotoUpload = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
  // État pour stocker la liste des fichiers sélectionnés par l'utilisateur
  const [files, setFiles] = useState<File[]>([]);
  // État pour les URLs d'aperçu
  const [previews, setPreviews] = useState<string[]>([]);
  // États pour stocker les descriptions et catégories associées à chaque fichier
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // États pour gérer l'interface utilisateur pendant l'upload
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Nettoyage des URLs d'aperçu pour éviter les fuites de mémoire
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Gère le changement dans l'input de type "file"
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Création des aperçus
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setFiles(selectedFiles);
      setDescriptions(Array(selectedFiles.length).fill(''));
      setCategories(Array(selectedFiles.length).fill('Atelier'));
    }
  };

  // Met à jour la description pour une photo spécifique
  const handleMetadataChange = (index: number, value: string, type: 'description' | 'category') => {
    if (type === 'description') {
      const newDescriptions = [...descriptions];
      newDescriptions[index] = value;
      setDescriptions(newDescriptions);
    } else {
      const newCategories = [...categories];
      newCategories[index] = value;
      setCategories(newCategories);
    }
  };

  // Supprimer un fichier de la liste de sélection
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Libérer la mémoire
    newPreviews.splice(index, 1);

    setFiles(newFiles);
    setPreviews(newPreviews);
    setDescriptions(prev => prev.filter((_, i) => i !== index));
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  // Gère la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Veuillez sélectionner au moins une photo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Création de l'objet FormData qui sera envoyé
    const formData = new FormData();

    // La spécification du backend attend `photos[]`, `descriptions[]`, `categories[]`
    // On ajoute chaque fichier et ses métadonnées au FormData.
    // Le fait d'appeler `append` plusieurs fois avec la même clé crée un tableau côté serveur.
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
      formData.append('descriptions', descriptions[i] || 'Aucune description');
      formData.append('categories', categories[i] || 'Général');
    }

    try {
      // Appel de notre fonction d'API avec le FormData
      const result = await couturierApi.uploadPhotos(formData);
      setSuccess(`Upload réussi ! ${result.photos.length} photo(s) ajoutée(s).`);
      if (onUploadSuccess) onUploadSuccess();
      
      // Réinitialiser le formulaire après succès
      setFiles([]);
      setPreviews([]);
      setDescriptions([]);
      setCategories([]);
      // Il faut aussi réinitialiser l'input de fichier lui-même
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 font-sans">
      <h3 className="text-lg font-semibold">Ajouter des photos à votre profil</h3>
      <form onSubmit={handleSubmit}>
        <div className="my-4">
          <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-1">Sélectionner des photos :</label>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
          />
        </div>

        {files.map((file, index) => (
          <div key={index} className="border border-gray-300 p-2.5 my-2.5 rounded-md flex items-center gap-4">
            {/* Aperçu de l'image */}
            <div className="w-20 h-20 shrink-0">
              <img src={previews[index]} alt="Aperçu" className="w-full h-full object-cover rounded" />
            </div>
            
            <div className="grow flex flex-col gap-2">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <label htmlFor={`desc-${index}`} className="sr-only">Description : </label>
            <input
              id={`desc-${index}`}
              type="text"
              value={descriptions[index]}
              onChange={(e) => handleMetadataChange(index, e.target.value, 'description')}
              placeholder="Ex: Robe de soirée en wax"
              className="w-full p-1.5 border border-gray-300 rounded-md text-sm"
            />
            <label htmlFor={`cat-${index}`} className="sr-only">Catégorie : </label>
            <input
              id={`cat-${index}`}
              type="text"
              value={categories[index]}
              onChange={(e) => handleMetadataChange(index, e.target.value, 'category')}
              placeholder="Ex: Atelier, Créations"
              className="w-full p-1.5 border border-gray-300 rounded-md text-sm"
            />
            </div>
            <button type="button" onClick={() => removeFile(index)} className="bg-red-500 text-white border-none w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-red-600 transition-colors">
              X
            </button>
          </div>
        ))}

        <button type="submit" disabled={isLoading || files.length === 0} className="mt-4 px-5 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50">
          {isLoading ? 'Envoi en cours...' : 'Uploader les photos'}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2.5">Erreur : {error}</p>}
      {success && <p className="text-green-600 mt-2.5">{success}</p>}
    </div>
  );
};

export default CouturierPhotoUpload;
