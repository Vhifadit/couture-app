const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Liens
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  couturier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Service demandé
  service_type: {
    type: String,
    enum: ['RETOUCHE', 'CREATION_SUR_MESURE', 'CONFECTION', 'AUTRE'],
    required: true
  },

  // Créneau
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },

  // Statut commande
  status: {
    type: String,
    enum: ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MODIFIED'],
    default: 'PLANNED'
  },

  // ✅ LIVRAISON (nouveau)
  livraison: {
    mode: {
      type: String,
      enum: ['RETRAIT_ATELIER', 'LIVRAISON'],
      default: 'RETRAIT_ATELIER'
    },
    adresse_retrait: {
      type: String, // "Atelier principal" ou adresse spécifique
      default: 'Atelier du couturier'
    },
    adresse_livraison: {
      rue: String,
      quartier: String,
      ville: String,
      instructions: String
    },
    cout_livraison: {
      type: Number,
      default: 0
    },
    statut_livraison: {
      type: String,
      enum: ['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ANNULEE'],
      default: 'EN_ATTENTE'
    },
    date_livraison_prevue: Date,
    date_livraison_effective: Date
  },

  // Détails
  notes: String,
  measurements: {
    type: Map,
    of: Number
  },

  // Historique modifications
  modifications: [{
    date: { type: Date, default: Date.now },
    type: String,
    description: String
  }]

}, { timestamps: true });

// Index
orderSchema.index({ client_id: 1 });
orderSchema.index({ couturier_id: 1 });
orderSchema.index({ date: 1 });

module.exports = mongoose.model('Order', orderSchema);