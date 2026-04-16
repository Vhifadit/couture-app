const Order = require('../models/order');
const User = require('../models/user');
const Couturier = require('../models/couturier');
const nodemailer = require('nodemailer'); // ✅ NOUVEAU: Notifications

const { createConversation } = require('./chat');

// ✅ Config email (à adapter avec vos credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'no-reply@tailleurconnect.com',
    pass: process.env.EMAIL_PASS || ''
  }
});




// ========== FONCTIONS EXISTANTES ==========

// POST /orders → créer une commande
const createOrder = async (req, res) => {
  try {
    const {
      couturier_id,
      service_type,
      date_rendez_vous,
      heure_rendez_vous,
      date_limite,
      heure_limite,
      notes,
      measurements
    } = req.body;

    const client_id = req.user.sub;

    if (!couturier_id || !service_type || !date_rendez_vous || !heure_rendez_vous || !date_limite || !heure_limite) {
      return res.status(400).json({ 
        message: 'Champs obligatoires manquants' 
      });
    }


    // Récupérer le profil couturier puis l'utilisateur associé (avec role populated)
    const couturierProfile = await Couturier.findById(couturier_id).populate({
      path: 'user_id',
      populate: { path: 'role' }
    });
    if (!couturierProfile) {
      return res.status(400).json({ message: 'Profil couturier non trouvé' });
    }
    
    const couturier = couturierProfile.user_id;
    if (!couturier || couturier.role.name !== 'couturier') {
      return res.status(400).json({ message: 'Utilisateur non autorisé comme couturier' });
    }



    // Vérifier la disponibilité du couturier pour le rendez-vous
    const heureDebut = heure_rendez_vous;
    const heureFin = '18:00'; // Durée standard d'1h30 par rendez-vous
    const existingOrder = await Order.findOne({
      couturier_id,
      date_rendez_vous,
      status: { $ne: 'CANCELLED' },
      $expr: {
        $and: [
          { $gte: ['$heure_rendez_vous', heureDebut] },
          { $lte: ['$heure_rendez_vous', heureFin] }
        ]
      }
    });


    if (existingOrder) {
      return res.status(409).json({ 
        message: 'Le couturier n\'est pas disponible sur ce créneau' 
      });
    }

    // ✅ VALIDATION DATES: RDV avant limite
    const rdvDate = new Date(`${date_rendez_vous}T${heure_rendez_vous}`);
    const limiteDate = new Date(`${date_limite}T${heure_limite}`);
    if (rdvDate >= limiteDate) {
      return res.status(400).json({ 
        message: 'La date de rendez-vous doit être avant la date limite' 
      });
    }

    // ✅ CALCUL PRIX TOTAL
    let prix_total = 0;
    let estimation_tarif = 0;
    
    // Tarif service depuis profil couturier
    const tarifsMap = {
      'RETOUCHE': couturierProfile.tarifs?.retouche || 5000,
      'CREATION_SUR_MESURE': couturierProfile.tarifs?.creation_sur_mesure || 25000,
      'CONFECTION': couturierProfile.tarifs?.confection || 15000,
      'AUTRE': 10000
    };
    estimation_tarif = tarifsMap[service_type];
    
    // Livraison par défaut
    const cout_livraison = 1500;

    const newOrder = await Order.create({
      client_id,
      couturier_id: couturierProfile.user_id._id, // ✅ FIX: Utilise User._id correct
      service_type,
      date_rendez_vous,
      heure_rendez_vous,
      date_limite,
      heure_limite,
      notes: notes || null,
      measurements: measurements || {},
      status: 'PLANNED',
      prix_estime: {
        tarif_service: estimation_tarif,
        cout_livraison: 0, // Sera mis à jour
        total: estimation_tarif
      },
      livraison: {
        mode: 'RETRAIT_ATELIER',
        statut_livraison: 'EN_ATTENTE'
      }
    });

    // ✅ CRÉER CONVERSATION
    await createConversation(
      newOrder._id,
      client_id,
      couturierProfile.user_id._id,
      `Commande #${newOrder._id.toString().slice(-6)} - ${service_type}`
    );

    // ✅ POPULATE POUR EMAIL
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('client_id', 'name email telephone')
      .populate('couturier_id', 'name email telephone');

    // ✅ NOTIFICATION EMAIL COUTURIER
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || '"TailleurConnect" <no-reply@tailleurconnect.com>',
        to: couturierProfile.user_id.email,
        subject: `🧵 Nouvelle commande #${newOrder._id.toString().slice(-6)}`,
        html: `
          <h2>Nouvelle commande reçue !</h2>
          <p><strong>Client:</strong> ${populatedOrder.client_id?.name || 'Nouveau client'}</p>
          <p><strong>Service:</strong> ${service_type}</p>
          <p><strong>RDV:</strong> ${date_rendez_vous} à ${heure_rendez_vous}</p>
          <p><strong>Prix estimé:</strong> ${estimation_tarif.toLocaleString()} FCFA</p>
          <a href="http://localhost:3000/dashboard/couturier/commandes" style="background:#2D6A4F;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Voir la commande</a>
        `
      });
      console.log(`✅ Email envoyé à ${couturierProfile.user_id.email}`);
    } catch (emailError) {
      console.warn('⚠️ Échec envoi email (non-bloquant):', emailError.message);
    }

    return res.status(201).json({
      message: 'Commande créée avec succès ! Notification envoyée au couturier.',
      order: populatedOrder,
      estimation: {
        tarif_service: estimation_tarif,
        cout_livraison: 0,
        total: estimation_tarif
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};




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

    const allowedUpdates = ['date_rendez_vous', 'heure_rendez_vous', 'date_limite', 'heure_limite', 'notes', 'measurements'];
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
  getDeliveryDetails,
  // ✅ NOUVEAU
  getUnreadOrders: async (req, res) => {
    try {
      const userId = req.user.sub;
      const orders = await Order.find({ 
        couturier_id: userId, 
        status: 'PLANNED' 
      }).countDocuments();
      res.json({ unread: orders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
