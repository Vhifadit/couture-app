const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Lien vers User (authentification)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Photo de profil
  photo: {
    type: String,
    default: null
  },
  
  // Informations personnelles (complémentaires au profil User)
  telephone: {
    type: String,
    required: true
  },
  
  // Adresses (pour livraison ou retrait)
  adresses: [{
    nom: { type: String, required: true }, // ex: "Domicile", "Bureau"
    rue: { type: String, required: true },
    quartier: { type: String, required: true },
    ville: { type: String, required: true },
    code_postal: String,
    pays: { type: String, default: 'Côte d\'Ivoire' },
    est_principale: { type: Boolean, default: false },
    instructions: String // ex: "2ème étage, sonner à droite"
  }],
  
  // Préférences (pour personnaliser l'expérience)
  preferences: {
    types_vetements: [{
      type: String,
      enum: ['ROBE', 'JUPE', 'PANTALON', 'CHEMISE', 'TENU_TRADITIONNELLE', 'AUTRE']
    }],
    tailles_habitudes: {
      haut: String,
      bas: String,
      chaussures: String
    },
    styles_preferes: [String], // ex: ["traditionnel", "moderne", "élégant"]
    budget_moyen: {
      type: String,
      enum: ['FAIBLE', 'MOYEN', 'ELEVE']
    }
  },
  
  // Mesures type (pour commandes futures)
  mesures_type: {
    tour_poitrine: Number,
    tour_taille: Number,
    tour_hanches: Number,
    longueur_bras: Number,
    longueur_jambe: Number,
    taille_totale: Number,
    autres: {
      type: Map,
      of: Number
    },
    date_mesure: Date
  },
  
  // Statistiques
  stats: {
    total_commandes: { type: Number, default: 0 },
    commandes_terminees: { type: Number, default: 0 },
    couturiers_favoris: [{
      couturier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nombre_commandes: Number
    }]
  },
  
  // Compte actif/inactif
  est_actif: {
    type: Boolean,
    default: true
  }
  
}, { timestamps: true });

// Index pour recherche
clientSchema.index({ user_id: 1 });
clientSchema.index({ 'adresses.ville': 1, 'adresses.quartier': 1 });

module.exports = mongoose.model('Client', clientSchema);


