// models/conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Lien avec la commande (optionnel mais recommandé)
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true  // Une conversation par commande
  },
  
  // Participants
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
  
  // Métadonnées
  sujet: {
    type: String,
    default: 'Discussion commande'
  },
  
  // Statut de la conversation
  statut: {
    type: String,
    enum: ['ACTIVE', 'FERMEE'],
    default: 'ACTIVE'
  },
  
  // Dernier message pour affichage rapide
  dernier_message: {
    contenu: String,
    date: Date,
    expediteur_id: mongoose.Schema.Types.ObjectId
  },
  
  // Compteur de messages non lus par participant
  non_lus_client: {
    type: Number,
    default: 0
  },
  non_lus_couturier: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);