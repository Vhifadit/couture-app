const Order = require('../models/order');
const User = require('../models/user');

const { createConversation } = require('./chat');


// ========== FONCTIONS EXISTANTES ==========

// POST /orders → créer une commande
const createOrder = async (req, res) => {
  try {
    const {
      couturier_id,
      service_type,
      date,
      start_time,
      end_time,
      notes,
      measurements
    } = req.body;

    const client_id = req.user.sub;

    if (!couturier_id || !service_type || !date || !start_time || !end_time) {
      return res.status(400).json({ 
        message: 'Champs obligatoires manquants' 
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: 'start_time doit être avant end_time' });
    }

    const couturier = await User.findById(couturier_id).populate('role');
    if (!couturier || couturier.role.name !== 'couturier') {
      return res.status(400).json({ message: 'Couturier invalide' });
    }

    const existingOrder = await Order.findOne({
      couturier_id,
      date,
      status: { $ne: 'CANCELLED' },
      $or: [
        { start_time: { $lt: end_time, $gte: start_time } },
        { end_time: { $gt: start_time, $lte: end_time } }
      ]
    });

    if (existingOrder) {
      return res.status(409).json({ 
        message: 'Le couturier n\'est pas disponible sur ce créneau' 
      });
    }

    const newOrder = await Order.create({
      client_id,
      couturier_id,
      service_type,
      date,
      start_time,
      end_time,
      notes: notes || null,
      measurements: measurements || {},
      status: 'PLANNED',
      livraison: {
        mode: 'RETRAIT_ATELIER',
        statut_livraison: 'EN_ATTENTE'
      }
    });
    await createConversation(
  newOrder._id,
  client_id,
  couturier_id,
  `Commande #${newOrder._id.toString().slice(-6)} - ${service_type}`
);

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    return res.status(201).json({
      message: 'Commande créée avec succès !',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// GET /orders → voir ses commandes
const getOrders = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;

    let query = {};
    
    if (userRole === 'client') {
      query.client_id = userId;
    } else if (userRole === 'couturier') {
      query.couturier_id = userId;
    }

    const orders = await Order.find(query)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// GET /orders/:id → détail d'une commande
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const order = await Order.findById(id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const isOwner = order.client_id._id.toString() === userId || 
                    order.couturier_id._id.toString() === userId;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /orders/:id/status → mettre à jour le statut
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.sub;

    const validStatuses = ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const isCouturier = order.couturier_id.toString() === userId;
    const isClient = order.client_id.toString() === userId;

    if (['CONFIRMED', 'IN_PROGRESS'].includes(status) && !isCouturier) {
      return res.status(403).json({ message: 'Seul le couturier peut changer vers ce statut' });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    return res.json({
      message: 'Statut mis à jour',
      order: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /orders/:id → modifier une commande
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.sub;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.client_id.toString() !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos commandes' });
    }

    if (!['PLANNED', 'MODIFIED'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Impossible de modifier une commande déjà confirmée' 
      });
    }

    const allowedUpdates = ['date', 'start_time', 'end_time', 'notes', 'measurements'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        order[field] = updates[field];
      }
    });

    order.status = 'MODIFIED';
    await order.save();

    return res.json({
      message: 'Commande modifiée',
      order
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// DELETE /orders/:id → annuler une commande
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const isOwner = order.client_id.toString() === userId || 
                    order.couturier_id.toString() === userId;

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Impossible d\'annuler une commande terminée' });
    }

    order.status = 'CANCELLED';
    await order.save();

    return res.json({ message: 'Commande annulée avec succès' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ========== FONCTIONS LIVRAISON ==========

// ✅ Choisir mode de livraison (Client)
const setDeliveryMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, adresse_livraison, cout_livraison } = req.body;
    const userId = req.user.sub;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.client_id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    if (!['PLANNED', 'MODIFIED'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Impossible de modifier la livraison après confirmation' 
      });
    }

    order.livraison.mode = mode || 'RETRAIT_ATELIER';
    
    if (mode === 'LIVRAISON') {
      order.livraison.adresse_livraison = adresse_livraison;
      order.livraison.cout_livraison = cout_livraison || 1500;
    } else {
      order.livraison.adresse_retrait = 'Atelier du couturier';
      order.livraison.cout_livraison = 0;
    }

    await order.save();

    res.json({
      message: 'Mode de livraison mis à jour',
      livraison: order.livraison
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Mettre à jour statut livraison (Couturier)
const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut_livraison, date_livraison_prevue } = req.body;
    const userId = req.user.sub;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.couturier_id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const validStatuses = ['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ANNULEE'];
    if (!validStatuses.includes(statut_livraison)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    order.livraison.statut_livraison = statut_livraison;
    
    if (date_livraison_prevue) {
      order.livraison.date_livraison_prevue = date_livraison_prevue;
    }
    
    if (statut_livraison === 'LIVREE') {
      order.livraison.date_livraison_effective = new Date();
      order.status = 'COMPLETED';
    }

    await order.save();

    res.json({
      message: 'Statut livraison mis à jour',
      livraison: order.livraison
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Voir détails livraison
const getDeliveryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const order = await Order.findById(id)
      .populate('client_id', 'name telephone')
      .populate('couturier_id', 'name telephone adresse');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const isOwner = order.client_id._id.toString() === userId || 
                    order.couturier_id._id.toString() === userId;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    res.json({
      livraison: order.livraison,
      commande: {
        id: order._id,
        status: order.status,
        client: order.client_id,
        couturier: order.couturier_id
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// ========== EXPORTS ==========
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateStatus,
  updateOrder,
  cancelOrder,
  setDeliveryMode,
  updateDeliveryStatus,
  getDeliveryDetails
};