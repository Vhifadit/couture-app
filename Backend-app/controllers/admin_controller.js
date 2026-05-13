const User = require('../models/user');
const Role = require('../models/role');
const Order = require('../models/order');
const Article = require('../models/article');
const Couturier = require('../models/couturier');
const Client = require('../models/client');

const ORDER_STATUS_LABELS = {
  PLANNED: 'En attente',
  CONFIRMED: 'Confirmee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  MODIFIED: 'Modifiee',
};

const toRoleName = (role) => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return role.name || null;
};

const toUserDto = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: toRoleName(user.role),
  status: user.status,
  active: user.status === 'actif',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.getStats = async (_req, res) => {
  try {
    const [couturierRole, clientRole] = await Promise.all([
      Role.findOne({ name: 'couturier' }).select('_id'),
      Role.findOne({ name: 'client' }).select('_id'),
    ]);

    const [
      totalUsers,
      totalOrders,
      totalArticles,
      pendingOrders,
      activeUsers,
      totalCouturiers,
      totalClients,
      recentOrdersRaw,
      recentUsersRaw,
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Article.countDocuments(),
      Order.countDocuments({ status: { $in: ['PLANNED', 'MODIFIED'] } }),
      User.countDocuments({ status: 'actif' }),
      couturierRole ? User.countDocuments({ role: couturierRole._id }) : Couturier.countDocuments(),
      clientRole ? User.countDocuments({ role: clientRole._id }) : Client.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client_id', 'name email')
        .populate('couturier_id', 'name email'),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('role', 'name'),
    ]);

    const recentOrders = recentOrdersRaw.map((order) => ({
      _id: order._id,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
      createdAt: order.createdAt,
      client: order.client_id
        ? { name: order.client_id.name, email: order.client_id.email }
        : null,
      couturier: order.couturier_id
        ? { name: order.couturier_id.name, email: order.couturier_id.email }
        : null,
    }));

    const recentUsers = recentUsersRaw.map(toUserDto);

    res.json({
      stats: {
        totalUsers,
        totalCouturiers,
        totalClients,
        totalOrders,
        totalArticles,
        pendingOrders,
        activeUsers,
      },
      recentOrders,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role: roleName, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (roleName) {
      const roleDoc = await Role.findOne({ name: roleName }).select('_id');
      if (roleDoc) {
        filter.role = roleDoc._id;
      } else {
        return res.json({ users: [], total: 0, page: Number(page), pages: 0 });
      }
    }

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [usersRaw, total] = await Promise.all([
      User.find(filter)
        .populate('role', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      User.countDocuments(filter),
    ]);

    res.json({
      users: usersRaw.map(toUserDto),
      total,
      count: total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role', 'name');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const roleName = toRoleName(user.role);
    let profile = null;

    if (roleName === 'couturier') {
      profile = await Couturier.findOne({ user_id: user._id });
    } else if (roleName === 'client') {
      profile = await Client.findOne({ user_id: user._id });
    }

    const ordersRaw = await Order.find({
      $or: [{ client_id: user._id }, { couturier_id: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const orders = ordersRaw.map((order) => ({
      _id: order._id,
      service_type: order.service_type,
      description: order.notes || ORDER_STATUS_LABELS[order.status] || 'Commande',
      status: order.status,
      createdAt: order.createdAt,
    }));

    res.json({ user: toUserDto(user), profile, orders });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;

    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) return res.status(400).json({ message: 'Role invalide' });
      updateData.role = roleDoc._id;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('role', 'name');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const roleName = toRoleName(user.role);
    if (roleName === 'couturier' && status === 'actif') {
      await Couturier.findOneAndUpdate(
        { user_id: user._id },
        { validation_status: 'VALIDE', disponibilite: true, disponibilite_statut: 'DISPONIBLE' }
      );
    }
    res.json({ message: 'Utilisateur mis a jour', user: toUserDto(user) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role', 'name');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (user._id.toString() === req.user.sub) {
      return res.status(400).json({ message: 'Impossible de desactiver votre propre compte' });
    }

    user.status = user.status === 'actif' ? 'inactif' : 'actif';
    await user.save();

    if (toRoleName(user.role) === 'couturier') {
      await Couturier.findOneAndUpdate(
        { user_id: user._id },
        {
          validation_status: user.status === 'actif' ? 'VALIDE' : 'EN_ATTENTE',
          disponibilite: user.status === 'actif',
          disponibilite_statut: user.status === 'actif' ? 'DISPONIBLE' : 'ABSENT'
        }
      );
    }

    res.json({
      message: `Compte ${user.status === 'actif' ? 'active' : 'desactive'}`,
      active: user.status === 'actif',
      user: { _id: user._id, status: user.status },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [articlesRaw, total] = await Promise.all([
      Article.find(filter)
        .populate({
          path: 'couturier_id',
          populate: { path: 'user_id', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Article.countDocuments(filter),
    ]);

    const articles = articlesRaw.map((article) => ({
      _id: article._id,
      title: article.titre,
      titre: article.titre,
      description: article.description,
      category: article.categorie,
      categorie: article.categorie,
      status: article.status,
      photos: (article.photos || []).map((photo) => photo.url || photo),
      createdAt: article.createdAt,
      couturier: article.couturier_id?.user_id
        ? {
            name: article.couturier_id.user_id.name,
            email: article.couturier_id.user_id.email,
          }
        : null,
    }));

    res.json({
      articles,
      total,
      count: total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.moderateArticle = async (req, res) => {
  try {
    const { action } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article introuvable' });

    if (action === 'delete') {
      await Article.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Article supprime' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action invalide' });
    }

    article.status = action === 'approve' ? 'publie' : 'rejete';
    article.moderatedAt = new Date();
    article.moderatedBy = req.user.sub;
    await article.save();

    res.json({
      message: `Article ${action === 'approve' ? 'approuve' : 'rejete'}`,
      article: {
        _id: article._id,
        status: article.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAllCouturiers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { nom_marque: { $regex: search, $options: 'i' } },
        { 'adresse.ville': { $regex: search, $options: 'i' } },
        { 'adresse.quartier': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [couturiersRaw, total] = await Promise.all([
      Couturier.find(query)
        .populate('user_id', 'name email status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Couturier.countDocuments(query),
    ]);

    const couturiers = couturiersRaw
      .filter((couturier) => !status || couturier.user_id?.status === status)
      .map((couturier) => ({
        _id: couturier.user_id?._id || couturier._id,
        profileId: couturier._id,
        name: couturier.nom_marque || couturier.user_id?.name,
        email: couturier.user_id?.email,
        status: couturier.user_id?.status || 'actif',
        location: [couturier.adresse?.quartier, couturier.adresse?.ville].filter(Boolean).join(', '),
        availability: couturier.disponibilite,
        createdAt: couturier.createdAt,
      }));

    res.json({
      couturiers,
      total: status ? couturiers.length : total,
      count: status ? couturiers.length : total,
      page: pageNumber,
      pages: Math.ceil((status ? couturiers.length : total) / limitNumber) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [ordersRaw, total] = await Promise.all([
      Order.find(filter)
        .populate('client_id', 'name email')
        .populate('couturier_id', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Order.countDocuments(filter),
    ]);

    const orders = ordersRaw.map((order) => ({
      _id: order._id,
      status: order.status,
      service_type: order.service_type,
      notes: order.notes,
      deliveryMode: order.livraison?.mode || null,
      createdAt: order.createdAt,
      client: order.client_id
        ? { name: order.client_id.name, email: order.client_id.email }
        : null,
      couturier: order.couturier_id
        ? { name: order.couturier_id.name, email: order.couturier_id.email }
        : null,
    }));

    res.json({
      orders,
      total,
      count: total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
