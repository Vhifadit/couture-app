const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Order = require('../models/order');

const contactPattern = /(\+?\d[\d\s().-]{6,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/|wa\.me|whatsapp|telegram)/i;

// ========== CONVERSATIONS ==========

// ✅ Créer une conversation (automatique lors de la création de commande)
const createConversation = async (orderId, clientId, couturierId, sujet = 'Discussion commande') => {
  try {
    const existing = await Conversation.findOne({ order_id: orderId });
    if (existing) return existing;

    const conversation = await Conversation.create({
      order_id: orderId,
      client_id: clientId,
      couturier_id: couturierId,
      sujet
    });

    return conversation;
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
};

// ✅ Voir mes conversations (Client ou Couturier)
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'client') {
      query.client_id = userId;
    } else if (userRole === 'couturier') {
      query.couturier_id = userId;
    } else {
      return res.status(403).json({ message: 'Rôle non autorisé pour cette fonction' });
    }

    const conversations = await Conversation.find(query)
      .populate('order_id', 'status date_rendez_vous service_type date_limite')
      .populate('client_id', 'name')
      .populate('couturier_id', 'name')
      .populate('dernier_message.expediteur_id', 'name')
      .sort({ 'dernier_message.date': -1 });

    // Formater la réponse avec les compteurs de non-lus appropriés
    const formatted = conversations.map(conv => ({
      _id: conv._id,
      id: conv._id,
      sujet: conv.sujet,
      statut: conv.statut,
      commande: conv.order_id,
      client: conv.client_id,
      couturier: conv.couturier_id,
      dernier_message: conv.dernier_message,
      non_lus: userRole === 'client' ? conv.non_lus_client : conv.non_lus_couturier,
      updatedAt: conv.updatedAt
    }));

    res.json({ count: conversations.length, conversations: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Voir une conversation spécifique (avec messages)
const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(id)
      .populate('order_id', 'status date_rendez_vous service_type date_limite heure_limite')
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = conversation.client_id._id.toString() === userId || 
                          conversation.couturier_id._id.toString() === userId;
    
    if (!isParticipant && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    // Récupérer les messages (pagination simple)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({ conversation_id: id })
      .populate('expediteur_id', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Marquer les messages comme lus pour cet utilisateur
    await markMessagesAsRead(id, userId, userRole);

    res.json({
      conversation: {
        _id: conversation._id,
        id: conversation._id,
        sujet: conversation.sujet,
        statut: conversation.statut,
        commande: conversation.order_id,
        client: conversation.client_id,
        couturier: conversation.couturier_id,
        createdAt: conversation.createdAt
      },
      messages: messages.reverse(), // Ordre chronologique
      pagination: { page, limit, total: await Message.countDocuments({ conversation_id: id }) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ========== MESSAGES ==========

// ✅ Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params; // conversation_id
    const { contenu, type = 'TEXTE' } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Vérifier la conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    if (conversation.statut === 'FERMEE') {
      return res.status(400).json({ message: 'Conversation fermée' });
    }

    // Vérifier que l'expéditeur est participant
    const isClient = conversation.client_id.toString() === userId;
    const isCouturier = conversation.couturier_id.toString() === userId;

    if (!isClient && !isCouturier && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const order = await Order.findById(conversation.order_id).select('status');
    if (order && !['CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'COMPLETED', 'LATE'].includes(order.status) && contactPattern.test(contenu)) {
      return res.status(400).json({
        message: 'Le partage de coordonnees personnelles est bloque avant validation de la commande'
      });
    }

    // Créer le message
    const message = await Message.create({
      conversation_id: id,
      expediteur_id: userId,
      expediteur_role: isClient ? 'client' : (isCouturier ? 'couturier' : 'admin'),
      contenu,
      type
    });

    // Mettre à jour la conversation (dernier message + compteurs non lus)
    const updateData = {
      dernier_message: {
        contenu: contenu.substring(0, 100), // Tronquer pour l'aperçu
        date: new Date(),
        expediteur_id: userId
      }
    };

    // Incrémenter le compteur de l'autre partie
    if (isClient) {
      updateData.non_lus_couturier = conversation.non_lus_couturier + 1;
      updateData.$set = { non_lus_client: 0 }; // Réinitialiser mes non-lus
    } else {
      updateData.non_lus_client = conversation.non_lus_client + 1;
      updateData.$set = { non_lus_couturier: 0 };
    }

    await Conversation.findByIdAndUpdate(id, updateData);

    // Populer et retourner
    const populatedMessage = await Message.findById(message._id)
      .populate('expediteur_id', 'name');

    res.status(201).json({
      message: 'Message envoyé',
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Marquer les messages comme lus (helper)
const markMessagesAsRead = async (conversationId, userId, userRole) => {
  try {
    // Marquer les messages de l'autre comme lus
    await Message.updateMany(
      {
        conversation_id: conversationId,
        expediteur_id: { $ne: userId },
        lu: false
      },
      {
        lu: true,
        date_lecture: new Date()
      }
    );

    // Réinitialiser le compteur de non-lus pour cet utilisateur
    const updateField = userRole === 'client' ? 'non_lus_client' : 'non_lus_couturier';
    await Conversation.findByIdAndUpdate(conversationId, {
      [updateField]: 0
    });
  } catch (error) {
    console.error('Mark as read error:', error);
  }
};

// ✅ Marquer manuellement comme lu (endpoint explicite)
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    await markMessagesAsRead(id, userId, userRole);

    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Fermer une conversation (quand commande terminée ou résolue)
const closeConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Seul un participant peut fermer
    const isParticipant = conversation.client_id.toString() === userId || 
                          conversation.couturier_id.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    conversation.statut = 'FERMEE';
    await conversation.save();

    // Message système de fermeture
    await Message.create({
      conversation_id: id,
      expediteur_id: userId,
      expediteur_role: 'admin',
      contenu: 'Conversation fermée',
      type: 'SYSTEME'
    });

    res.json({ message: 'Conversation fermée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Obtenir le nombre de messages non lus (pour badge notification)
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;

    let query = {};
    let countField = userRole === 'client' ? 'non_lus_client' : 'non_lus_couturier';

    if (userRole === 'client') {
      query.client_id = userId;
    } else if (userRole === 'couturier') {
      query.couturier_id = userId;
    }

    const result = await Conversation.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: `$${countField}` } } }
    ]);

    const total = result.length > 0 ? result[0].total : 0;

    res.json({ count: total, non_lus_total: total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createConversation, // Export pour utilisation dans order.js
  getMyConversations,
  getConversation,
  sendMessage,
  markAsRead,
  closeConversation,
  getUnreadCount
};
