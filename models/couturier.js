// models/couturier.js
const mongoose = require('mongoose');

const couturierSchema = new mongoose.Schema({
  // Lien vers User (existant)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Infos professionnelles (existant)
  nom_marque: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  telephone: {
    type: String,
    required: true
  },
  
  // Adresse et localisation (existant)
  adresse: {
    rue: String,
    ville: { type: String, required: true },
    quartier: { type: String, required: true },
    code_postal: String,
    pays: { type: String, default: 'Côte d\'Ivoire' }
  },
  
  localisation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  
  // Services et disponibilité (existant)
  services: [{
    type: String,
    enum: ['RETOUCHE', 'CREATION_SUR_MESURE', 'CONFECTION', 'AUTRE']
  }],
  
  disponibilite: {
    type: Boolean,
    default: true
  },
  
  horaires: {
    lundi: { ouvert: Boolean, debut: String, fin: String },
    mardi: { ouvert: Boolean, debut: String, fin: String },
    mercredi: { ouvert: Boolean, debut: String, fin: String },
    jeudi: { ouvert: Boolean, debut: String, fin: String },
    vendredi: { ouvert: Boolean, debut: String, fin: String },
    samedi: { ouvert: Boolean, debut: String, fin: String },
    dimanche: { ouvert: Boolean, debut: String, fin: String }
  },
  
  tarifs: {
    retouche: Number,
    creation_sur_mesure: Number,
    confection: Number
  },

  // ✅ NOUVEAU : Photos de réalisations/portfolio
  photos: [{
    url: { type: String, required: true },           // URL Cloudinary/AWS S3/local
    public_id: { type: String },                     // ID pour suppression Cloudinary
    description: { type: String, maxlength: 500 },   // Description de la photo
    categorie: { 
      type: String, 
      enum: ['ROBE', 'JUPE', 'PANTALON', 'CHEMISE', 'TENU_TRADITIONNELLE', 'AUTRE']
    },
    est_principale: { type: Boolean, default: false }, // Photo principale du profil
    created_at: { type: Date, default: Date.now }
  }],

  // Statistiques (existant)
  stats: {
    total_commandes: { type: Number, default: 0 },
    commandes_terminees: { type: Number, default: 0 },
    note_moyenne: { type: Number, default: 0 },
    nombre_avis: { type: Number, default: 0 }
  }
  
}, { timestamps: true });

// Index (existant + nouveau pour recherche par catégorie de photo)
couturierSchema.index({ localisation: '2dsphere' });
couturierSchema.index({ 'adresse.ville': 1, 'adresse.quartier': 1 });
couturierSchema.index({ disponibilite: 1 });
couturierSchema.index({ 'photos.categorie': 1 }); // Nouveau index

module.exports = mongoose.model('Couturier', couturierSchema);