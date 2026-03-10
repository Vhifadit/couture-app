// src/components/CouturierPhotoManager.tsx
import React, { useEffect, useState } from 'react';
import { couturierApi, Photo } from '../lib/api';
import CouturierPhotoUpload from './CouturierPhotoUpload';

interface CouturierPhotoManagerProps {
  initialPhotos: Photo[];
  onDataChange: () => void; // Callback pour dire au parent de recharger les données
}

const CouturierPhotoManager: React.FC<CouturierPhotoManagerProps> = ({ initialPhotos, onDataChange }) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const handleDelete = async (photoId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    try {
      await couturierApi.deletePhoto(photoId); // This should already be correct from api.ts
      onDataChange(); // Dire au parent de recharger
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleSetMain = async (photoId: string) => {
    try {
      await couturierApi.setMainPhoto(photoId); // This should already be correct from api.ts
      onDataChange(); // Dire au parent de recharger
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold mb-4">Gestion de vos photos</h2>
      
      {/* Section Upload */}
      <div className="mb-10 bg-gray-50 p-5 rounded-lg mt-4">
        <CouturierPhotoUpload onUploadSuccess={onDataChange} />
      </div>

      {/* Liste des photos existantes */}
      <h3 className="text-lg font-medium mb-3">Vos photos en ligne ({photos.length})</h3>
      
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 mt-4">
        {photos.map(photo => (
          <div key={photo._id} className="border border-gray-300 rounded-lg overflow-hidden relative">
            <img 
              src={photo.url} 
              alt={photo.description || "Photo couturier"} 
              className="w-full h-52 object-cover"
            />
            {photo.est_principale && (
              <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-gray-800 px-2 py-0.5 rounded text-xs font-bold">
                Principale
              </span>
            )}
            
            <div className="p-2.5">
              <p className="text-sm mb-2.5 text-gray-600 truncate">
                {photo.description || "Sans description"}
              </p>
              
              <div className="flex gap-2.5 justify-between items-center">
                {!photo.est_principale && (
                  <button 
                    onClick={() => handleSetMain(photo._id)}
                    className="text-xs px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
                  >
                    Définir principale
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(photo._id)}
                  className="text-xs px-2 py-1 bg-red-500 text-white border-none rounded-md cursor-pointer hover:bg-red-600 ml-auto"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {photos.length === 0 && (
        <p className="italic text-gray-500 mt-4">Aucune photo pour le moment.</p>
      )}
    </div>
  );
};

export default CouturierPhotoManager;
