import { Couturier, Commande, Conversation, Message, Article } from './types';

export const couturiers: Couturier[] = [
  {
    id: '1',
    user_id: 'user1',
    nom_marque: 'Sophie Couture',
    description: 'Couturière professionnelle avec 10 ans d\'expérience.',
    telephone: '+229 97 00 00 01',
    adresse: { ville: 'Cotonou', quartier: 'Gbegamey' },
    disponibilite: true,
    services: ['CREATION_SUR_MESURE', 'RETOUCHE'],
    photos: [],
    stats: { note_moyenne: 4.9, nombre_avis: 120 },
  },
  {
    id: '2',
    user_id: 'user2',
    nom_marque: 'Atelier du Style',
    description: 'Spécialisé dans les tenues formelles.',
    telephone: '+229 97 00 00 02',
    adresse: { ville: 'Cotonou', quartier: 'Fidjrossè' },
    disponibilite: true,
    services: ['CONFECTION', 'CREATION_SUR_MESURE'],
    photos: [],
    stats: { note_moyenne: 4.8, nombre_avis: 85 },
  },
  {
    id: '3',
    user_id: 'user3',
    nom_marque: 'Mode & Chic',
    description: 'Créations originales pour toutes occasions.',
    telephone: '+229 97 00 00 03',
    adresse: { ville: 'Abomey-Calavi', quartier: 'Zogbadjè' },
    disponibilite: false,
    services: ['CONFECTION', 'RETOUCHE'],
    photos: [],
    stats: { note_moyenne: 4.4, nombre_avis: 60 },
  },
];

export const articles: Article[] = [
  { id: 'a1', couturier_id: '1', titre: 'Robe Ankara', description: 'Robe longue en tissu Ankara.', categorie: 'ROBE', prix: 25000 },
  { id: 'a2', couturier_id: '1', titre: 'Ensemble deux pièces', description: 'Haut et jupe assortis.', categorie: 'TENU_TRADITIONNELLE', prix: 35000 },
  { id: 'a3', couturier_id: '2', titre: 'Veste sur mesure', description: 'Veste élégante sur mesure.', categorie: 'VESTE', prix: 60000 },
  { id: 'a4', couturier_id: '3', titre: 'Chemise Homme', description: 'Chemise en coton.', categorie: 'CHEMISE', prix: 15000 },
];

export const commandesClient: Commande[] = [
  {
    id: 'CMD001',
    client_id: 'client1',
    couturier_id: '1',
    couturierNom: 'Sophie Couture',
    articleTitre: 'Robe sur mesure',
    date: '2026-02-20',
    status: 'IN_PROGRESS',
    prix_total: 15000,
    service_type: 'CREATION_SUR_MESURE',
    livraison: {
      mode: 'LIVRAISON',
      statut_livraison: 'EN_ATTENTE',
    },
  },
  {
    id: 'CMD002',
    client_id: 'client1',
    couturier_id: '2',
    couturierNom: 'Atelier du Style',
    articleTitre: 'Veste sur mesure',
    date: '2026-02-15',
    status: 'PLANNED',
    prix_total: 30000,
    service_type: 'CREATION_SUR_MESURE',
    livraison: {
      mode: 'RETRAIT_ATELIER',
      statut_livraison: 'EN_ATTENTE',
    },
  },
  {
    id: 'CMD003',
    client_id: 'client1',
    couturier_id: '3',
    couturierNom: 'Mode & Chic',
    articleTitre: 'Retouche Pantalon',
    date: '2026-02-10',
    status: 'COMPLETED',
    prix_total: 5000,
    service_type: 'RETOUCHE',
    livraison: {
      mode: 'RETRAIT_ATELIER',
      statut_livraison: 'LIVREE',
    },
  },
];

export const commandesCouturier: Commande[] = [
  {
    id: 'ORD1025',
    client_id: 'client2',
    clientNom: 'Alex Martin',
    couturier_id: '1',
    articleTitre: 'Veste sur mesure',
    date: '2026-02-22',
    status: 'PLANNED',
    prix_total: 32000,
    service_type: 'CREATION_SUR_MESURE',
    livraison: {
      mode: 'LIVRAISON',
      statut_livraison: 'EN_ATTENTE',
    },
  },
  // ... autres commandes pour le couturier
];

