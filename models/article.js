const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  // Lien vers le couturier
  couturier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couturier',
    required: true
  },
  
  // Informations de l'article
  titre: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Catégorie de vêtement
  categorie: {
    type: String,
    required: true,
    enum: ['ROBE', 'JUPE', 'PANTALON', 'CHEMISE', 'TENU_TRADITIONNELLE', 'VESTE', 'AUTRE']
  },
  
  // Prix indicatif
  prix: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Photos de l'article (plusieurs)
  photos: [{
    url: { type: String, required: true },
    description: { type: String, default: '' },
    est_principale: { type: Boolean, default: false }
  }],
  
  // Tags pour recherche
  tags: [{
    type: String,
    trim: true
  }],
  
  // Disponibilité (l'article est-il encore réalisable ?)
  disponible: {
    type: Boolean,
    default: true
  },
  
  // Statistiques
  stats: {
    vues: { type: Number, default: 0 },
    commandes: { type: Number, default: 0 }
  }
  
}, { timestamps: true });

// Index pour recherche
articleSchema.index({ couturier_id: 1 });
articleSchema.index({ categorie: 1 });
articleSchema.index({ disponible: 1 });
articleSchema.index({ prix: 1 });
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema);