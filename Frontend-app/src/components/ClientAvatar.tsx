'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { clientApi, couturierApi } from '@/lib/api';
import { normalizePhotoUrl } from '@/lib/utils';

interface ClientAvatarProps {
  size?: number;
  className?: string;
}

export default function ClientAvatar({ size = 32, className = '' }: ClientAvatarProps) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [nomMarque, setNomMarque] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user) return;
      try {
        if (user.role === 'couturier') {
          const res = await couturierApi.getMyProfile();
          if (res.couturier?.photo) setPhoto(res.couturier.photo);
          else setPhoto(null);
          
          if (res.couturier?.nom_marque) setNomMarque(res.couturier.nom_marque);
          else setNomMarque(null);
        } else if (user.role === 'client') {
          const res = await clientApi.getMyProfile();
          if (res?.client?.photo) setPhoto(res.client.photo);
          else setPhoto(null);
          setNomMarque(null);
        }

      } catch (err) {
        console.error("Erreur chargement avatar:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfilePhoto();

    // Écouter les mises à jour de profil pour rafraîchir l'avatar
    const handleUpdate = () => fetchProfilePhoto();
    window.addEventListener('profileUpdate', handleUpdate);
    return () => window.removeEventListener('profileUpdate', handleUpdate);
  }, [user]);

  if (!isLoading && photo) {
    const photoSrc = normalizePhotoUrl(photo);

    return (
      <div 
        className={`relative rounded-full overflow-hidden border border-[#C9B99A] ${className}`}
        style={{ width: size, height: size }}
      >
        <Image 
          src={photoSrc} 
          alt="Avatar" 
          fill 
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className={`rounded-full bg-[#F5EFE6] flex items-center justify-center text-[#2D6A4F] border border-[#C9B99A] font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(() => {
        // Priorité 1: Nom de marque (pour couturier)
        if (nomMarque) return nomMarque.trim()[0].toUpperCase();
        
        // Priorité 2: Nom utilisateur
        const userName = user?.name?.trim();
        if (userName) return userName[0].toUpperCase();
        
        // Fallback
        return 'C';
      })()}
    </div>
  );
}
