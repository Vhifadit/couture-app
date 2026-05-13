const Order = require('../models/order');
const Couturier = require('../models/couturier');
const Review = require('../models/review');
const Notification = require('../models/notification');
const nodemailer = require('nodemailer'); 

const { createConversation } = require('./chat');

const ACTIVE_ORDER_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'READY', 'LATE'];
const FINAL_ORDER_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED'];
const VALID_ORDER_STATUSES = ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'MODIFIED', 'LATE'];

const hasRole = (req, roleName) => {
  return req.user?.role === roleName || req.user?.role?.name === roleName;
};

const sameId = (value, userId) => {
  if (!value) return false;
  if (typeof value === 'string') return value === userId;
  if (value._id) return value._id.toString() === userId;
  return value.toString() === userId;
};

const notifyUser = async ({ user_id, order_id, type, titre, message }) => {
  try {
    return await Notification.create({ user_id, order_id, type, titre, message });
  } catch (error) {
    console.warn('Notification non creee:', error.message);
    return null;
  }
};

const addStatusModification = (order, type, description) => {
  order.modifications.push({ type, description, date: new Date() });
};

const refreshAutomaticAvailability = async (couturierUserId) => {
  const profile = await Couturier.findOne({ user_id: couturierUserId });
  if (!profile || profile.disponibilite_statut === 'ABSENT') return profile;
  const activeCount = await Order.countDocuments({
    couturier_id: couturierUserId,
    status: { $in: ACTIVE_ORDER_STATUSES }
  });
  const busy = activeCount >= (profile.max_commandes_en_cours || 5);
  profile.disponibilite_statut = busy ? 'OCCUPE' : 'DISPONIBLE';
  profile.disponibilite = !busy;
  await profile.save();
  return profile;
};

// Config email (à adapter avec vos credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'no-reply@tailleurconnect.com',
    pass: process.env.EMAIL_PASS || ''
  }
});

// POST /orders → créer une commande
// POST /orders -> creer une commande
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
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const couturierProfile = await Couturier.findById(couturier_id).populate({
      path: 'user_id',
      populate: { path: 'role' }
    });
    if (!couturierProfile) return res.status(400).json({ message: 'Profil couturier non trouve' });

    await refreshAutomaticAvailability(couturierProfile.user_id._id);
    const freshProfile = await Couturier.findById(couturier_id).populate({
      path: 'user_id',
      populate: { path: 'role' }
    });

    const couturier = freshProfile.user_id;
    if (!couturier || couturier.role.name !== 'couturier') {
      return res.status(400).json({ message: 'Utilisateur non autorise comme couturier' });
    }
    const validationOk = !freshProfile.validation_status || freshProfile.validation_status === 'VALIDE';
    if (!freshProfile.disponibilite || freshProfile.disponibilite_statut !== 'DISPONIBLE' || !validationOk) {
      return res.status(409).json({ message: "Ce couturier n'est pas disponible pour une nouvelle commande" });
    }

    const existingOrder = await Order.findOne({
      couturier_id: freshProfile.user_id._id,
      date_rendez_vous,
      status: { $nin: FINAL_ORDER_STATUSES }
    });
    if (existingOrder) {
      return res.status(409).json({ message: "Le couturier n'est pas disponible sur ce creneau" });
    }

    const rdvDate = new Date(`${date_rendez_vous}T${heure_rendez_vous}`);
    const limiteDate = new Date(`${date_limite}T${heure_limite}`);
    if (rdvDate >= limiteDate) {
      return res.status(400).json({ message: 'La date de rendez-vous doit etre avant la date limite' });
    }

    const tarifsMap = {
      RETOUCHE: freshProfile.tarifs?.retouche || 5000,
      CREATION_SUR_MESURE: freshProfile.tarifs?.creation_sur_mesure || 25000,
      CONFECTION: freshProfile.tarifs?.confection || 15000,
      AUTRE: 10000
    };
    const estimation_tarif = tarifsMap[service_type] || tarifsMap.AUTRE;

    const newOrder = await Order.create({
      client_id,
      couturier_id: freshProfile.user_id._id,
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
        cout_livraison: 0,
        total: estimation_tarif
      },
      livraison: {
        mode: 'RETRAIT_ATELIER',
        statut_livraison: 'EN_ATTENTE'
      }
    });

    await createConversation(
      newOrder._id,
      client_id,
      freshProfile.user_id._id,
      `Commande #${newOrder._id.toString().slice(-6)} - ${service_type}`
    );

    await Promise.all([
      notifyUser({
        user_id: client_id,
        order_id: newOrder._id,
        type: 'ORDER_CREATED',
        titre: 'Commande creee',
        message: 'Votre commande a ete creee et attend la validation du couturier.'
      }),
      notifyUser({
        user_id: freshProfile.user_id._id,
        order_id: newOrder._id,
        type: 'ORDER_CREATED',
        titre: 'Nouvelle commande',
        message: `Nouvelle commande ${service_type} a traiter.`
      })
    ]);

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('client_id', 'name email telephone')
      .populate('couturier_id', 'name email telephone');

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || '"TailleurConnect" <no-reply@tailleurconnect.com>',
        to: freshProfile.user_id.email,
        subject: `Nouvelle commande #${newOrder._id.toString().slice(-6)}`,
        html: `<h2>Nouvelle commande recue</h2><p>Service: ${service_type}</p><p>RDV: ${date_rendez_vous} a ${heure_rendez_vous}</p>`
      });
    } catch (emailError) {
      console.warn('Echec envoi email:', emailError.message);
    }

    return res.status(201).json({
      message: 'Commande creee avec succes !',
      order: populatedOrder,
      estimation: { tarif_service: estimation_tarif, cout_livraison: 0, total: estimation_tarif }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
const getOrders = async (req, res) => {
  try {
    const userId = req.user.sub;
    let userRole = req.user.role?.name || req.user.role || 'client';
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

    const isOwner = sameId(order.client_id, userId) || sameId(order.couturier_id, userId);
    
    if (!isOwner && !hasRole(req, 'admin')) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /orders/:id/status → mettre à jour le statut
// PUT /orders/:id/status -> mettre a jour le statut
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date_livraison_prevue } = req.body;
    const userId = req.user.sub;

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvee' });

    const isCouturier = sameId(order.couturier_id, userId);
    const isAdmin = hasRole(req, 'admin');
    if (!isCouturier && !isAdmin) {
      return res.status(403).json({ message: 'Seul le couturier peut changer le statut de la commande' });
    }

    if (status === 'CONFIRMED') {
      order.date_acceptation = new Date();
      order.livraison.date_livraison_prevue = date_livraison_prevue || order.livraison.date_livraison_prevue || order.date_limite;
    }

    if (status === 'READY') {
      order.livraison.statut_livraison = 'EN_ATTENTE';
    }

    if (status === 'DELIVERED' || status === 'COMPLETED') {
      order.status = status === 'COMPLETED' ? 'COMPLETED' : 'DELIVERED';
      order.livraison.statut_livraison = 'LIVREE';
      order.livraison.date_livraison_effective = new Date();
      order.is_late = false;
    } else if (status === 'LATE') {
      order.status = 'LATE';
      order.is_late = true;
    } else {
      order.status = status;
    }

    addStatusModification(order, 'STATUS', `Statut mis a jour: ${order.status}`);
    await order.save();
    await refreshAutomaticAvailability(order.couturier_id);

    await notifyUser({
      user_id: order.client_id,
      order_id: order._id,
      type: 'ORDER_STATUS_CHANGED',
      titre: 'Statut de commande mis a jour',
      message: `Votre commande est maintenant: ${order.status}.`
    });

    const updatedOrder = await Order.findById(id)
      .populate('client_id', 'name email')
      .populate('couturier_id', 'name email');

    return res.json({ message: 'Statut mis a jour', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
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
// DELETE /orders/:id -> annuler une commande
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvee' });

    const isClient = sameId(order.client_id, userId);
    const isCouturier = sameId(order.couturier_id, userId);
    const isAdmin = hasRole(req, 'admin');

    if (!isClient && !isCouturier && !isAdmin) return res.status(403).json({ message: 'Acces interdit' });
    if (['DELIVERED', 'COMPLETED'].includes(order.status)) {
      return res.status(400).json({ message: "Impossible d'annuler une commande terminee" });
    }
    if (isClient && !['PLANNED', 'MODIFIED'].includes(order.status) && !isAdmin) {
      return res.status(403).json({ message: 'Le client peut annuler uniquement avant acceptation' });
    }

    order.status = 'CANCELLED';
    order.date_annulation = new Date();
    order.cancelled_by = userId;
    addStatusModification(order, 'CANCELLED', 'Commande annulee');
    await order.save();
    await refreshAutomaticAvailability(order.couturier_id);

    await Promise.all([
      notifyUser({ user_id: order.client_id, order_id: order._id, type: 'ORDER_CANCELLED', titre: 'Commande annulee', message: 'La commande a ete annulee.' }),
      notifyUser({ user_id: order.couturier_id, order_id: order._id, type: 'ORDER_CANCELLED', titre: 'Commande annulee', message: 'Une commande a ete annulee par le client.' })
    ]);

    return res.json({ message: 'Commande annulee avec succes' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
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

    order.prix_estime.cout_livraison = order.livraison.cout_livraison || 0;
    order.prix_estime.total =
      (order.prix_estime.tarif_service || 0) + (order.prix_estime.cout_livraison || 0);

    await order.save();

    res.json({
      message: 'Mode de livraison mis à jour',
      livraison: order.livraison
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour statut livraison (Couturier)
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
    await refreshAutomaticAvailability(order.couturier_id);

    await notifyUser({
      user_id: order.client_id,
      order_id: order._id,
      type: 'ORDER_STATUS_CHANGED',
      titre: 'Livraison mise a jour',
      message: `Statut livraison: ${statut_livraison}.`
    });

    res.json({
      message: 'Statut livraison mis à jour',
      livraison: order.livraison
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Voir détails livraison
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

    const isOwner = sameId(order.client_id, userId) || sameId(order.couturier_id, userId);
    
    if (!isOwner && !hasRole(req, 'admin')) {
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

// Get unread orders count for couturier
const getUnreadOrders = async (req, res) => {
  try {
    const userId = req.user.sub;
    const count = await Order.countDocuments({ 
      couturier_id: userId, 
      status: 'PLANNED' 
    });
    res.json({ unread: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ POST /:id/review - Ajouter une review
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, commentaire } = req.body;
    const clientId = req.user.sub;

    // Validation
    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
    }

    // Récupérer la commande
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier que c'est le client propriétaire de la commande
    if (order.client_id.toString() !== clientId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à noter cette commande' });
    }

    // Vérifier que la commande est complétée
    if (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') {
      return res.status(400).json({ message: 'Vous pouvez seulement noter une commande livrée ou complétée' });
    }

    // Vérifier qu'aucune review n'existe déjà
    const existingReview = await Review.findOne({ order_id: id });
    if (existingReview) {
      return res.status(400).json({ message: 'Vous avez déjà noté cette commande' });
    }

    // Récupérer le profil couturier par user_id (order.couturier_id est un user_id)
    const couturier = await Couturier.findOne({ user_id: order.couturier_id });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }

    // Créer la review
    const review = await Review.create({
      order_id: id,
      client_id: clientId,
      couturier_id: couturier._id,  // Couturier._id
      couturier_user_id: order.couturier_id,  // User._id du couturier
      note,
      commentaire: commentaire || null
    });

    // Récupérer toutes les reviews du couturier pour calculer la moyenne
    const allReviews = await Review.find({ couturier_id: couturier._id });
    const totalNotes = allReviews.reduce((sum, r) => sum + r.note, 0);
    const moyenneNotes = (totalNotes / allReviews.length).toFixed(2);

    // Mettre à jour les stats du couturier
    couturier.stats = {
      ...couturier.stats,
      note_moyenne: parseFloat(moyenneNotes),
      nombre_avis: allReviews.length
    };
    await couturier.save();

    return res.status(201).json({
      message: 'Merci pour votre avis!',
      review: {
        _id: review._id,
        note: review.note,
        commentaire: review.commentaire,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de review:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// EXPORTS
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
  getUnreadOrders,
  addReview
};
