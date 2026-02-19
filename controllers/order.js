const Order = require('../models/order');
const User = require('../models/user');

// POST /orders → créer une commande
const createOrder = async (req, res) => {
  try {
    const {
      couturier_id,
      service_type,
      location,
      date,
      start_time,
      end_time,
      notes,
      measurements
    } = req.body;

    // Récupérer l'ID du client depuis le token JWT
    const client_id = req.user.sub;

    // Vérifications de base
    if (!couturier_id || !service_type || !date || !start_time || !end_time) {
      return res.status(400).json({ 
        message: 'Champs obligatoires manquants: couturier_id, service_type, date, start_time, end_time' 
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: 'start_time doit être avant end_time' });
    }

    // Vérifier que le couturier existe
    const couturier = await User.findById(couturier_id).populate('role');
    if (!couturier) {
      return res.status(404).json({ message: 'Couturier non trouvé' });
    }
    if (couturier.role.name !== 'couturier') {
      return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un couturier' });
    }

    // Vérifier les conflits de créneau
    const existingOrder = await Order.findOne({
      couturier_id,
      date,
      status: { $ne: 'CANCELLED' },
      $or: [
        { start_time: { $lt: end_time, $gte: start_time } },
        { end_time: { $gt: start_time, $lte: end_time } },
        { start_time: { $lte: start_time }, end_time: { $gte: end_time } }
      ]
    });

    if (existingOrder) {
      return res.status(409).json({ 
        message: 'Le couturier n\'est pas disponible sur ce créneau' 
      });
    }

    // Création de la commande
    const newOrder = await Order.create({
      client_id,
      couturier_id,
      service_type,
      location: location || null,
      date,
      start_time,
      end_time,
      notes: notes || null,
      measurements: measurements || {},
      status: 'PLANNED'
    });

    // Populate pour la réponse
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
    
    // Filtrer selon le rôle
    if (userRole === 'client') {
      query.client_id = userId;
    } else if (userRole === 'couturier') {
      query.couturier_id = userId;
    }
    // Admin voit tout (pas de filtre)

    const orders = await Order.find(query)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// GET /orders/:id → détail d'une commande
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const order = await Order.findById(id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier les permissions
    const isOwner = order.client_id._id.toString() === userId || 
                    order.couturier_id._id.toString() === userId;
    
    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /orders/:id/status → mettre à jour le statut
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const validStatuses = ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier les permissions selon le statut
    const isCouturier = order.couturier_id.toString() === userId;
    const isClient = order.client_id.toString() === userId;

    // Seul le couturier peut confirmer/démarrer/terminer
    if (['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status) && !isCouturier && userRole !== 'admin') {
      return res.status(403).json({ message: 'Seul le couturier peut changer vers ce statut' });
    }

    // Le client peut annuler sa commande
    if (status === 'CANCELLED' && !isClient && !isCouturier && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
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
    console.error('Update status error:', error);
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

    // Vérifier que c'est bien le client
    if (order.client_id.toString() !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos commandes' });
    }

    // Ne pas modifier si déjà confirmée ou en cours
    if (['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Impossible de modifier une commande déjà confirmée ou en cours' 
      });
    }

    // Champs autorisés à modifier
    const allowedUpdates = ['date', 'start_time', 'end_time', 'notes', 'measurements', 'location'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        order[field] = updates[field];
      }
    });

    order.status = 'MODIFIED';
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    return res.json({
      message: 'Commande modifiée',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// DELETE /orders/:id → annuler une commande
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const isOwner = order.client_id.toString() === userId || 
                    order.couturier_id.toString() === userId;

    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Impossible d\'annuler une commande terminée' });
    }

    order.status = 'CANCELLED';
    await order.save();

    return res.json({ message: 'Commande annulée avec succès' });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateStatus,
  updateOrder,
  cancelOrder
};

