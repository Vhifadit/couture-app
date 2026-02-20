// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Lien avec la conversation
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true  // Pour recherche rapide des messages d'une conversation
  },
  
  // Expéditeur
  expediteur_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expediteur_role: {
    type: String,
    enum: ['client', 'couturier', 'admin'],
    required: true
  },
  
  // Contenu
  contenu: {
    type: String,
    required: true,
    maxlength: 2000  // Limite raisonnable pour MVP
  },
  
  // Type de message (pour extensibilité future)
  type: {
    type: String,
    enum: ['TEXTE', 'IMAGE', 'SYSTEME'],
    default: 'TEXTE'
  },
  
  // Pièce jointe (URL si image - MVP simple)
  piece_jointe: {
    url: String,
    nom: String
  },
  
  // Statut de lecture
  lu: {
    type: Boolean,
    default: false
  },
  date_lecture: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// Index pour pagination (messages récents d'abord)
messageSchema.index({ conversation_id: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);