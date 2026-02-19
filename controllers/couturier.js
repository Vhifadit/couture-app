// controllers/couturier.js
const Couturier = require('../models/couturier');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// ========== EXISTANT (conservé) ==========

// Créer un profil couturier
const createProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const user = await User.findById(userId).populate('role');
    if (user.role.name !== 'couturier') {
      return res.status(403).json({ message: 'Seuls les couturiers peuvent créer un profil' });
    }
    
    const existing = await Couturier.findOne({ user_id: userId });
    if (existing) {
      return res.status(409).json({ message: 'Profil couturier déjà existant' });
    }
    
    const {
      nom_marque,
      description,
      telephone,
      adresse,
      localisation,
      services,
      horaires,
      tarifs
    } = req.body;
    
    const couturier = await Couturier.create({
      user_id: userId,
      nom_marque,
      description,
      telephone,
      adresse,
      localisation,
      services,
      horaires,
      tarifs,
      photos: [] // Initialiser tableau vide
    });
    
    res.status(201).json({ message: 'Profil créé', couturier });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Recherche par zone (existant)
const searchCouturiers = async (req, res) => {
  try {
    const { ville, quartier, service, disponible } = req.query;
    
    let query = {};
    
    if (ville) {
      query['adresse.ville'] = new RegExp(ville, 'i');
    }
    
    if (quartier) {
      query['adresse.quartier'] = new RegExp(quartier, 'i');
    }
    
    if (service) {
      query.services = service;
    }
    
    if (disponible === 'true') {
      query.disponibilite = true;
    }
    
    const couturiers = await Couturier.find(query)
      .populate('user_id', 'name email')
      .select('-__v');
    
    res.json({ 
      count: couturiers.length,
      couturiers 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Recherche géographique (existant)
const searchNearby = async (req, res) => {
  try {
    const { longitude, latitude, distance = 10 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ 
        message: 'Longitude et latitude requises' 
      });
    }
    
    const couturiers = await Couturier.find({
      localisation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: distance * 1000
        }
      },
      disponibilite: true
    }).populate('user_id', 'name email');
    
    res.json({ 
      count: couturiers.length,
      couturiers 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir son profil (existant)
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const couturier = await Couturier.findOne({ user_id: userId })
      .populate('user_id', 'name email');
    
    if (!couturier) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    res.json({ couturier });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour profil (existant)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const updates = req.body;
    
    // Empêcher la modification directe des photos via ce endpoint
    delete updates.photos;
    
    const couturier = await Couturier.findOneAndUpdate(
      { user_id: userId },
      updates,
      { new: true }
    );
    
    if (!couturier) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    res.json({ message: 'Profil mis à jour', couturier });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer disponibilité (existant)
const setAvailability = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { disponible } = req.body;
    
    const couturier = await Couturier.findOneAndUpdate(
      { user_id: userId },
      { disponibilite: disponible },
      { new: true }
    );
    
    res.json({ 
      message: `Disponibilité mise à jour: ${disponible ? 'Disponible' : 'Indisponible'}`,
      disponibilite: couturier.disponibilite
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir un couturier par ID (existant)
const getCouturierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const couturier = await Couturier.findById(id)
      .populate('user_id', 'name email createdAt');
    
    if (!couturier) {
      return res.status(404).json({ message: 'Couturier non trouvé' });
    }
    
    res.json({ couturier });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ========== NOUVEAU : GESTION DES PHOTOS ==========

// ✅ Upload de photos
const uploadPhotos = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucune photo fournie' });
    }
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      // Supprimer les fichiers uploadés si erreur
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({ message: 'Profil couturier non trouvé' });
    }
    
    // Construire les objets photo
    const newPhotos = req.files.map((file, index) => ({
      url: `/uploads/couturiers/${file.filename}`,
      description: req.body.descriptions?.[index] || '',
      categorie: req.body.categories?.[index] || 'AUTRE',
      est_principale: couturier.photos.length === 0 && index === 0 // Première photo = principale
    }));
    
    // Ajouter les photos au tableau
    couturier.photos.push(...newPhotos);
    await couturier.save();
    
    res.status(201).json({
      message: `${newPhotos.length} photo(s) ajoutée(s)`,
      photos: newPhotos
    });
    
  } catch (error) {
    // Nettoyage en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer une photo
const deletePhoto = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Trouver la photo
    const photo = couturier.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    
    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Retirer du tableau
    couturier.photos.pull(photoId);
    
    // Si on supprime la photo principale, définir la première comme principale
    if (photo.est_principale && couturier.photos.length > 0) {
      couturier.photos[0].est_principale = true;
    }
    
    await couturier.save();
    
    res.json({ message: 'Photo supprimée' });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Définir une photo comme principale
const setMainPhoto = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Réinitialiser toutes les photos
    couturier.photos.forEach(photo => {
      photo.est_principale = (photo._id.toString() === photoId);
    });
    
    await couturier.save();
    
    res.json({ message: 'Photo principale mise à jour' });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Mettre à jour description/categorie d'une photo
const updatePhotoInfo = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;
    const { description, categorie } = req.body;
    
    const couturier = await Couturier.findOne({ user_id: userId });
    if (!couturier) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    const photo = couturier.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    
    if (description !== undefined) photo.description = description;
    if (categorie !== undefined) photo.categorie = categorie;
    
    await couturier.save();
    
    res.json({ message: 'Photo mise à jour', photo });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Obtenir les photos d'un couturier (public)
const getPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const couturier = await Couturier.findById(id).select('photos nom_marque');
    if (!couturier) {
      return res.status(404).json({ message: 'Couturier non trouvé' });
    }
    
    res.json({
      couturier: couturier.nom_marque,
      photos: couturier.photos
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  // Existant
  createProfile,
  searchCouturiers,
  searchNearby,
  getMyProfile,
  updateProfile,
  setAvailability,
  getCouturierById,
  // Nouveau
  uploadPhotos,
  deletePhoto,
  setMainPhoto,
  updatePhotoInfo,
  getPhotos
};