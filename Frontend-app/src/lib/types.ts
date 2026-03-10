// Fichier: src/lib/types.ts
// Ce fichier centralise les types de données partagés dans l'application,
// en s'assurant qu'ils correspondent aux modèles du backend.

/**
 * Correspond au modèle `User` du backend.
 */
export interface User {
  id: string; // Correspond à `_id`
  name: string;
  email: string;
  role: 'admin' | 'couturier' | 'client';
}

/**
 * Correspond au modèle `Photo` imbriqué dans `Couturier`.
 */
export interface Photo {
  url: string;
  description?: string;
  categorie?: string;
  est_principale?: boolean;
}

/**
 * Correspond au modèle `Couturier` du backend.
 * J'ai adapté les noms de champs pour correspondre (ex: nom -> nom_marque).
 */
export interface Couturier {
  id: string; // Correspond à `_id`
  user_id: string;
  nom_marque: string;
  description?: string;
  telephone: string;
  adresse: {
    rue?: string;
    ville: string;
    quartier: string;
  };
  disponibilite: boolean;
  services: string[];
  photos: Photo[];
  stats: {
    note_moyenne: number;
    nombre_avis: number;
  };
}

/**
 * Correspond au modèle `Article` du backend.
 * Les catégories sont en majuscules pour correspondre à l'enum du backend.
 */
export interface Article {
  id: string; // Correspond à `_id`
  couturier_id: string;
  titre: string;
  description: string;
  categorie: 'ROBE' | 'JUPE' | 'PANTALON' | 'CHEMISE' | 'TENU_TRADITIONNELLE' | 'VESTE' | 'AUTRE';
  prix: number;
  photos?: Photo[];
}

/**
 * Correspond au modèle `Order` (Commande) du backend.
 * C'est ici que les changements sont les plus importants.
 */
export interface Commande {
  id: string; // Correspond à `_id`
  client_id: string;
  couturier_id: string;
  
  // Informations sur la commande
  service_type: 'RETOUCHE' | 'CREATION_SUR_MESURE' | 'CONFECTION' | 'AUTRE';
  date: string; // Gardé en string pour la simplicité d'affichage
  status: 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Nouvel objet pour la livraison, aligné sur le backend
  livraison: {
    mode: 'RETRAIT_ATELIER' | 'LIVRAISON';
    statut_livraison: 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
    adresse_livraison?: {
        rue: string;
        quartier: string;
        ville: string;
    }
  };

  // Le prix doit être un nombre, et non une chaîne formatée
  prix_total: number;

  // Informations affichées dans les listes (dénormalisées)
  clientNom?: string;
  couturierNom?: string;
  articleTitre?: string;
}

export interface Conversation {
    id: string;
    order_id: string;
    client_id: string;
    couturier_id: string;
    dernier_message?: { contenu: string; date: Date };
    non_lus: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    expediteur_id: string;
    contenu: string;
    createdAt: string;
    est_mien: boolean; // Pour l'affichage
}