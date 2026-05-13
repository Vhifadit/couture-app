/**
 * Normalise l'URL d'une photo pour s'assurer qu'elle est exploitable par le navigateur.
 * Ajoute un slash initial si nécessaire pour les chemins relatifs du backend (ex: uploads/...).
 */
export const normalizePhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  const v = String(url).trim();
  if (!v) return '';

  // URLs absolues (http, https), blobs (URL.createObjectURL) ou data URIs
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('blob:') || v.startsWith('data:')) {
    return v;
  }

  // Si l'URL commence déjà par un slash, on la renvoie telle quelle
  if (v.startsWith('/')) {
    return v;
  }

  // Pour les chemins relatifs type "uploads/...", on ajoute le slash initial
  return `/${v}`;
};
