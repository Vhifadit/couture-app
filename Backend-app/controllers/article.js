const Article = require('../models/article');
const Couturier = require('../models/couturier');

// ✅ Créer un article (Couturier)
const createArticle = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Récupérer le profil couturier
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }
    
    const { titre, description, categorie, prix, photos, tags } = req.body;
    
    // Validation
    if (!titre || !description || !categorie || !prix) {
      return res.status(400).json({ 
        message: 'Champs obligatoires: titre, description, categorie, prix' 
      });
    }

    // Gestion des photos uploadées
    let photosArray = [];
    if (req.files && req.files.length > 0) {
      photosArray = req.files.map((file, index) => ({
        url: file.path.replaceAll('\\', '/'),
        est_principale: index === 0
      }));
    } else if (photos && Array.isArray(photos)) {
      photosArray = photos;
    }
    
    const article = await Article.create({
      couturier_id: couturier._id,
      titre,
      description,
      categorie,
      prix,
      photos: photosArray,
      tags: tags || [],
      disponible: true
    });
    
    res.status(201).json({
      message: 'Article créé avec succès',
      article
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Voir tous mes articles (Couturier)
const getMyArticles = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const couturier = await Couturier.findOne({ user_id: userId }).populate('user_id');
    if (!couturier) {
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }
    
    const articles = await Article.find({ couturier_id: couturier._id })
      .sort({ createdAt: -1 });
    
    res.json({ count: articles.length, articles });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Voir un article par ID (Public)
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id)
      .populate('couturier_id', 'nom_marque telephone adresse');
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    // Incrémenter les vues
    article.stats.vues += 1;
    await article.save();
    
    res.json({ article });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Modifier un article (Couturier)
const updateArticle = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }
    
    const article = await Article.findOne({ 
      _id: id, 
      couturier_id: couturier._id 
    });
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé ou non autorisé' });
    }
    
    const updates = req.body;
    const allowedUpdates = ['titre', 'description', 'categorie', 'prix', 'tags', 'disponible'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        article[field] = updates[field];
      }
    });

    // Gestion des nouvelles photos si uploadées
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file, index) => ({
        url: file.path.replaceAll('\\', '/'),
        est_principale: article.photos.length === 0 && index === 0
      }));
      article.photos = [...article.photos, ...newPhotos];
    } else if (updates.photos !== undefined) {
      article.photos = updates.photos;
    }
    
    await article.save();
    
    res.json({ message: 'Article mis à jour', article });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un article (Couturier)
const deleteArticle = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }
    
    const article = await Article.findOneAndDelete({ 
      _id: id, 
      couturier_id: couturier._id 
    });
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé ou non autorisé' });
    }
    
    res.json({ message: 'Article supprimé' });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Rechercher des articles (Public)
const searchArticles = async (req, res) => {
  try {
    const { categorie, prix_min, prix_max, couturier_id, disponible } = req.query;
    
    let query = {};
    
    if (categorie) query.categorie = categorie;
    if (couturier_id) query.couturier_id = couturier_id;
    if (disponible === 'true') query.disponible = true;
    
    // Filtre prix
    if (prix_min || prix_max) {
      query.prix = {};
      if (prix_min) query.prix.$gte = parseInt(prix_min);
      if (prix_max) query.prix.$lte = parseInt(prix_max);
    }
    
    const articles = await Article.find(query)
      .populate('couturier_id', 'nom_marque telephone adresse.ville adresse.quartier')
      .sort({ createdAt: -1 });
    
    res.json({ count: articles.length, articles });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Voir articles d'un couturier (Public)
const getArticlesByCouturier = async (req, res) => {
  try {
    const { couturierId } = req.params;
    
    const articles = await Article.find({ 
      couturier_id: couturierId,
      disponible: true
    }).sort({ createdAt: -1 });
    
    res.json({ count: articles.length, articles });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createArticle,
  getMyArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticlesByCouturier
};