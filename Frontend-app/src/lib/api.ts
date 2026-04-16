// Fichier: src/lib/api.ts
// Ce fichier centralise la configuration des appels API vers le backend.

import axios, { AxiosError } from 'axios';

// ==================== TYPES ====================

// Réponse d'authentification du backend
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Pour la réponse de /auth/me
export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type pour les mesures
export interface Measurements {
  tour_poitrine?: number;
  tour_taille?: number;
  tour_hanches?: number;
  longueur_bras?: number;
  longueur_jambe?: number;
  taille_totale?: number;
  autres?: Record<string, number>;
}

// Type pour l'adresse
export interface Address {
  _id?: string;
  nom: string;
  rue: string;
  quartier: string;
  ville: string;
  code_postal?: string;
  pays?: string;
  est_principale?: boolean;
  instructions?: string;
}

// Type pour la livraison
export interface Livraison {
  mode: 'RETRAIT_ATELIER' | 'LIVRAISON';
  adresse_retrait?: string;
  adresse_livraison?: Address;
  cout_livraison?: number;
  statut_livraison: 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
  date_livraison_prevue?: string;
  date_livraison_effective?: string;
}

// Type pour les photos
export interface Photo {
  _id?: string;
  url: string;
  public_id?: string;
  description?: string;
  categorie?: string;
  est_principale?: boolean;
  created_at?: string;
}

// Type pour le profil couturier
export interface CouturierProfile {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  nom_marque: string;
  description?: string;
  telephone: string;
  adresse?: {
    rue?: string;
    ville: string;
    quartier: string;
    code_postal?: string;
    pays?: string;
  };
  disponibilite: boolean;
  services: string[];
  photos: Photo[];
  tarifs?: {
    retouche?: number;
    creation_sur_mesure?: number;
    confection?: number;
  };
  horaires?: {
    lundi?: { ouvert?: boolean; debut?: string; fin?: string };
    mardi?: { ouvert?: boolean; debut?: string; fin?: string };
    mercredi?: { ouvert?: boolean; debut?: string; fin?: string };
    jeudi?: { ouvert?: boolean; debut?: string; fin?: string };
    vendredi?: { ouvert?: boolean; debut?: string; fin?: string };
    samedi?: { ouvert?: boolean; debut?: string; fin?: string };
    dimanche?: { ouvert?: boolean; debut?: string; fin?: string };
  };
  stats?: {
    note_moyenne: number;
    nombre_avis: number;
    total_commandes?: number;
    commandes_terminees?: number;
  };
}

// Type pour le profil client
export interface ClientProfile {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  photo?: string | null;
  telephone: string;
  adresses: Address[];
  preferences?: {
    types_vetements?: string[];
    styles_preferes?: string[];
    budget_moyen?: string;
  };
  mesures_type?: Measurements & { date_mesure?: string };
  stats?: {
    total_commandes: number;
    commandes_terminees: number;
  };
}

// Type pour l'article
export interface Article {
  _id: string;
  couturier_id: string;
  titre: string;
  description: string;
  categorie: string;
  prix: number;
  photos?: Photo[];
  createdAt?: string;
  updatedAt?: string;
}

// Type pour l'ordre/commande
export interface Order {
  _id: string;
  client_id: string | {
    _id: string;
    name: string;
    email: string;
  };
  couturier_id: string | {
    _id: string;
    name: string;
    email: string;
  };
  service_type: string;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  date_limite: string;
  heure_limite: string;
  status: string;
  livraison?: Livraison;
  notes?: string;
  measurements?: Measurements;
  modifications?: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour le chat
export interface Conversation {
  _id: string;
  order_id: string;
  client_id: string | { _id: string; name: string };
  couturier_id: string | { _id: string; name: string };
  dernier_message?: { contenu: string; date: string };
  non_lus: number;
  closed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  conversation_id: string;
  expediteur_id: string;
  contenu: string;
  createdAt: string;
}

// ==================== API CLIENT ====================

// Création d'une instance Axios pré-configurée.
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type pour les préférences client
export interface ClientPreferences {
  types_vetements?: string[];
  styles_preferes?: string[];
  budget_moyen?: string;
  [key: string]: unknown;
}

// Flag pour éviter les boucles infinies avec le refresh token
let isRefreshing = false;
type QueuePromise = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};
let failedQueue: QueuePromise[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Intercepteur pour ajouter le token d'authentification si disponible
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Si pas de requête originale, on rejette
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Si 401 et pas déjà en train de rafraîchir et c'est une requête authentifiée
    if (error.response?.status === 401 && !isRefreshing) {
      // Vérifier si c'est une requête de login/refresh - on ne rafraîchit PAS在这些请求
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
        // C'est une requête d'authentification, on ne rafraîchit pas le token
        return Promise.reject(error);
      }

      // Vérifier s'il y a un refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Pas de refresh token, déconnecter
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const response = await axios.post('http://localhost:3001/api/auth/refresh', {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Réessayer la requête originale
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null);
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh échoué, déconnecter
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Pour les erreurs 401 qui arrivent pendant un refresh, attendre
    if (error.response?.status === 401 && isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        const token = localStorage.getItem('token');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  
  register: async (data: { name: string; email: string; password: string; role: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
  
  me: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>('/auth/me');
    return response.data;
  },
  
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  
  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put<{ message: string }>('/auth/password', data);
    return response.data;
  },
  
  updateProfile: async (data: { name: string }) => {
    const response = await apiClient.put<{ message: string; user: { id: string; name: string; email: string; role: string } }>('/auth/profile', data);
    return response.data;
  },
  
  uploadPhoto: async (formData: FormData) => {
    const response = await apiClient.post<{ message: string; photo: string }>('/auth/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== ORDER API ====================

export const orderApi = {
  // Créer une commande
  create: async (orderData: {
    couturier_id: string;
    service_type: string;
    date_rendez_vous: string;
    heure_rendez_vous: string;
    date_limite: string;
    heure_limite: string;
    notes?: string;
    measurements?: Measurements;
    livraison?: {
      mode: 'RETRAIT_ATELIER' | 'LIVRAISON';
      adresse_livraison?: Address;
      cout_livraison?: number;
    };
  }) => {
    const response = await apiClient.post<{ message: string; order: Order }>('/orders', orderData);
    return response.data;
  },
  
  // Obtenir toutes ses commandes
  getAll: async () => {
    const response = await apiClient.get<{ orders: Order[] }>('/orders');
    return response.data;
  },
  
  // Obtenir une commande par ID
  getById: async (id: string) => {
    const response = await apiClient.get<{ order: Order }>(`/orders/${id}`);
    return response.data;
  },
  
  // Mettre à jour le statut (couturier)
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put<{ message: string; order: Order }>(`/orders/${id}/status`, { status });
    return response.data;
  },
  
  // Modifier une commande (client)
  updateOrder: async (id: string, updates: Partial<Order>) => {
    const response = await apiClient.put<{ message: string; order: Order }>(`/orders/${id}`, updates);
    return response.data;
  },
  
  // Annuler une commande
  cancelOrder: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/orders/${id}`);
    return response.data;
  },
  
  // Définir le mode de livraison
  setDeliveryMode: async (id: string, data: {
    mode: 'RETRAIT_ATELIER' | 'LIVRAISON';
    adresse_livraison?: Address;
    cout_livraison?: number;
  }) => {
    const response = await apiClient.put<{ message: string; livraison: Livraison }>(`/orders/${id}/livraison`, data);
    return response.data;
  },
  
  // Mettre à jour le statut de livraison (couturier)
  updateDeliveryStatus: async (id: string, data: {
    statut_livraison: string;
    date_livraison_prevue?: string;
  }) => {
    const response = await apiClient.put<{ message: string; livraison: Livraison }>(`/orders/${id}/livraison/status`, data);
    return response.data;
  },
  
  // Obtenir les détails de livraison
  getDeliveryDetails: async (id: string) => {
    const response = await apiClient.get<{ livraison: Livraison; commande: Order }>(`/orders/${id}/livraison`);
    return response.data;
  },
};

// ==================== COUTURIER API ====================

export const couturierApi = {
  // Rechercher des couturiers
  search: async (params: {
    ville?: string;
    quartier?: string;
    service?: string;
    disponible?: boolean;
  } = {}) => {
    const response = await apiClient.get<{ count: number; couturiers: CouturierProfile[] }>('/couturiers/search', { params });
    return response.data;
  },
  
  // Obtenir un couturier par ID
  getById: async (id: string) => {
    const response = await apiClient.get<{ couturier: CouturierProfile }>(`/couturiers/${id}`);
    return response.data;
  },
  
  // ✅ NOUVEAU: Obtenir tarifs couturier (pour formulaire commande)
  getTarifs: async (id: string) => {
    const response = await apiClient.get<{
      couturier: string;
      tarifs: Record<string, number>;
      services: string[];
    }>(`/couturiers/${id}/tarifs`);
    return response.data;
  },

  // Compteur commandes en attente
  getUnreadOrders: async () => {
    const response = await apiClient.get<{ unread: number }>('/orders/unread');
    return response.data;
  },
  
  // Obtenir son propre profil (couturier)
  getMyProfile: async () => {
    const response = await apiClient.get<{ couturier: CouturierProfile }>('/couturiers/profile/me');
    return response.data;
  },
  
  // Obtenir les meilleurs couturiers (pour page d'accueil)
  getTop: async (limit: number = 3) => {
    const response = await apiClient.get<{ count: number; couturiers: CouturierProfile[] }>('/couturiers/top', { params: { limit } });
    return response.data;
  },
  
  // Créer son profil (couturier)
  createProfile: async (data: Partial<CouturierProfile>) => {
    const response = await apiClient.post<{ message: string; couturier: CouturierProfile }>('/couturiers/profile', data);
    return response.data;
  },
  
  // Mettre à jour son profil
  updateProfile: async (data: Partial<CouturierProfile>) => {
    const response = await apiClient.put<{ message: string; couturier: CouturierProfile }>('/couturiers/profile/me', data);
    return response.data;
  },
  
  // Définir disponibilité
  setAvailability: async (disponible: boolean) => {
    const response = await apiClient.put<{ message: string; disponibilite: boolean }>('/couturiers/availability', { disponible });
    return response.data;
  },
  
  // Upload de photos
  uploadPhotos: async (formData: FormData) => {
    const response = await apiClient.post<{ message: string; photos: Photo[] }>('/couturiers/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // Supprimer une photo
  deletePhoto: async (photoId: string) => {
    const response = await apiClient.delete<{ message: string }>(`/couturiers/photos/${photoId}`);
    return response.data;
  },
  
  // Définir photo principale
  setMainPhoto: async (photoId: string) => {
    const response = await apiClient.put<{ message: string }>(`/couturiers/photos/${photoId}/main`);
    return response.data;
  },
  
  // Obtenir les photos d'un couturier
  getPhotos: async (id: string) => {
    const response = await apiClient.get<{ couturier: string; photos: Photo[] }>(`/couturiers/${id}/photos`);
    return response.data;
  },
  
  // Rechercher à proximité
  searchNearby: async (longitude: number, latitude: number, distance: number = 10) => {
    const response = await apiClient.get<{ count: number; couturiers: CouturierProfile[] }>('/couturiers/nearby', {
      params: { longitude, latitude, distance },
    });
    return response.data;
  },
};

// ==================== CLIENT API ====================

export const clientApi = {
  // Obtenir son profil
  getMyProfile: async () => {
    const response = await apiClient.get<{ client: ClientProfile }>('/clients/profile/me');
    return response.data;
  },
  
  // Obtenir le profil d'un client par son userId (pour les couturiers)
  getByUserId: async (userId: string) => {
    const response = await apiClient.get<{ client: ClientProfile }>(`/clients/user/${userId}`);
    return response.data;
  },
  
  // Obtenir un couturier par son userId (pour les clients)
  getCouturierByUserId: async (userId: string) => {
    const response = await apiClient.get<{ couturier: CouturierProfile }>(`/clients/couturier/user/${userId}`);
    return response.data;
  },
  
  // Créer son profil
  createProfile: async (data: {
    telephone: string;
    adresses?: Address[];
    preferences?: ClientPreferences;
    mesures_type?: Measurements;
  }) => {
    const response = await apiClient.post<{ message: string; client: ClientProfile }>('/clients/profile', data);
    return response.data;
  },
  
  // Mettre à jour son profil
  updateProfile: async (data: {
    telephone?: string;
    preferences?: ClientPreferences;
    mesures_type?: Measurements;
  }) => {
    const response = await apiClient.put<{ message: string; client: ClientProfile }>('/clients/profile/me', data);
    return response.data;
  },
  
  // Ajouter une adresse
  addAddress: async (address: Address) => {
    const response = await apiClient.post<{ message: string; adresses: Address[] }>('/clients/addresses', address);
    return response.data;
  },
  
  // Supprimer une adresse
  removeAddress: async (addressId: string) => {
    const response = await apiClient.delete<{ message: string; adresses: Address[] }>(`/clients/addresses/${addressId}`);
    return response.data;
  },
  
  // Mettre à jour les mesures
  updateMeasurements: async (measurements: Measurements) => {
    const response = await apiClient.put<{ message: string; mesures: Measurements }>('/clients/measurements', measurements);
    return response.data;
  },
  
  // Obtenir les mesures
  getMeasurements: async () => {
    const response = await apiClient.get<{ mesures: Measurements }>('/clients/measurements');
    return response.data;
  },
};

// ==================== CHAT API ====================

export const chatApi = {
  // Obtenir ses conversations
  getConversations: async () => {
    const response = await apiClient.get<{ conversations: Conversation[] }>('/chat/conversations');
    return response.data;
  },
  
  // Obtenir le nombre de messages non lus
  getUnreadCount: async () => {
    const response = await apiClient.get<{ count: number }>('/chat/conversations/unread');
    return response.data;
  },
  
  // Obtenir une conversation par ID
  getConversation: async (id: string) => {
    const response = await apiClient.get<{ conversation: Conversation; messages: Message[] }>(`/chat/conversations/${id}`);
    return response.data;
  },
  
  // Envoyer un message
  sendMessage: async (conversationId: string, contenu: string) => {
    const response = await apiClient.post<{ message: Message }>(`/chat/conversations/${conversationId}/messages`, { contenu });
    return response.data;
  },
  
  // Marquer comme lu
  markAsRead: async (conversationId: string) => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },
  
  // Fermer une conversation
  closeConversation: async (conversationId: string) => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/close`);
    return response.data;
  },
};

// ==================== ARTICLE API ====================

export const articleApi = {
  // Rechercher des articles
  search: async (params: { q?: string; categorie?: string; couturier_id?: string } = {}) => {
    const response = await apiClient.get<{ articles: Article[] }>('/articles/search', { params });
    return response.data;
  },
  
  // Obtenir un article par ID
  getById: async (id: string) => {
    const response = await apiClient.get<{ article: Article }>(`/articles/${id}`);
    return response.data;
  },
  
  // Obtenir les articles d'un couturier
  getByCouturier: async (couturierId: string) => {
    const response = await apiClient.get<{ articles: Article[] }>(`/articles/couturier/${couturierId}`);
    return response.data;
  },
  
  // Créer un article (couturier)
  create: async (data: {
    titre: string;
    description: string;
    categorie: string;
    prix: number;
    photos?: string[];
  }) => {
    const response = await apiClient.post<{ article: Article }>('/articles', data);
    return response.data;
  },
  
  // Mettre à jour un article (couturier)
  update: async (id: string, data: Partial<Article>) => {
    const response = await apiClient.put<{ article: Article }>(`/articles/${id}`, data);
    return response.data;
  },
  
  // Supprimer un article (couturier)
  delete: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/articles/${id}`);
    return response.data;
  },
  
  // Obtenir ses propres articles (couturier)
  getMyArticles: async () => {
    const response = await apiClient.get<{ articles: Article[] }>('/articles/my/articles');
    return response.data;
  },
};

export default apiClient;

