const path = require('path');
const fs = require('fs');

const Couturier = require('../models/couturier');
const Review = require('../models/review');
const Order = require('../models/order');

// Helpers
const ensureArray = (v) => (Array.isArray(v) ? v : []);

const getUploadedUrl = (filename) => {
  if (!filename) return null;
  if (typeof filename === 'string' && filename.startsWith('http')) return filename;
  return String(filename).replaceAll('\\', '/');
};

const deleteLocalFileIfExists = async (filePath) => {
  try {
    if (!filePath) return;
    const normalized = String(filePath).replaceAll('\\', '/');
    if (!normalized.includes('uploads/')) return;

    const absoluteCandidates = [
      path.join(process.cwd(), normalized),
      path.join(process.cwd(), normalized.startsWith('/') ? normalized.slice(1) : normalized),
    ];

    for (const candidate of absoluteCandidates) {
      if (fs.existsSync(candidate)) {
        await fs.promises.unlink(candidate);
        return;
      }
    }
  } catch {
    // ignore
  }
};

const getMainPhotoUrl = (photos) => {
  const list = ensureArray(photos);
  return (
    list.find((p) => !!p?.est_principale)?.url ||
    list[0]?.url ||
    null
  );
};

// ✅ POST /profile
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.sub;

    const existing = await Couturier.findOne({ user_id: userId });
    if (existing) {
      return res.status(409).json({ message: 'Profil couturier deja existant' });
    }

    const {
      nom_marque,
      description,
      telephone,
      adresse,
      localisation,
      services,
      disponibilite,
      disponibilite_statut,
      max_commandes_en_cours,
      contacts,
      horaires,
      tarifs,
    } = req.body;

    if (!nom_marque || !telephone) {
      return res.status(400).json({ message: 'Champs obligatoires: nom_marque, telephone' });
    }

    const profile = await Couturier.create({
      user_id: userId,
      nom_marque,
      description: description || '',
      telephone,
      adresse: adresse || {},
      localisation: localisation || { type: 'Point', coordinates: [0, 0] },
      services: ensureArray(services),
      disponibilite: disponibilite ?? true,
      disponibilite_statut: disponibilite_statut || 'DISPONIBLE',
      max_commandes_en_cours: max_commandes_en_cours || 5,
      contacts: contacts || {},
      horaires: horaires || {},
      tarifs: tarifs || {},
    });

    return res.status(201).json({ message: 'Profil couturier cree avec succes', couturier: profile });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /profile/me
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.sub;

    const profile = await Couturier.findOne({ user_id: userId }).lean();
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    profile.photos = ensureArray(profile.photos).map((p) => ({
      _id: p._id,
      url: p.url,
      public_id: p.public_id,
      description: p.description,
      categorie: p.categorie,
      est_principale: !!p.est_principale,
      created_at: p.created_at,
    }));

    profile.photo = getMainPhotoUrl(profile.photos);

    return res.json({ couturier: profile });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ PUT /profile/me
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.sub;

    const {
      nom_marque,
      description,
      telephone,
      adresse,
      localisation,
      services,
      disponibilite,
      disponibilite_statut,
      max_commandes_en_cours,
      contacts,
      horaires,
      tarifs,
    } = req.body;

    const updateData = {
      ...(nom_marque !== undefined ? { nom_marque } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(telephone !== undefined ? { telephone } : {}),
      ...(adresse !== undefined ? { adresse } : {}),
      ...(localisation !== undefined ? { localisation } : {}),
      ...(services !== undefined ? { services: ensureArray(services) } : {}),
      ...(disponibilite !== undefined ? { disponibilite } : {}),
      ...(disponibilite_statut !== undefined ? { disponibilite_statut } : {}),
      ...(max_commandes_en_cours !== undefined ? { max_commandes_en_cours } : {}),
      ...(contacts !== undefined ? { contacts } : {}),
      ...(horaires !== undefined ? { horaires } : {}),
      ...(tarifs !== undefined ? { tarifs } : {}),
    };

    const profile = await Couturier.findOneAndUpdate({ user_id: userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    return res.json({ message: 'Profil mis a jour', couturier: profile });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ PUT /availability
exports.setAvailability = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { disponibilite, disponibilite_statut } = req.body;

    const profile = await Couturier.findOne({ user_id: userId });
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    if (typeof disponibilite === 'boolean') profile.disponibilite = disponibilite;
    if (disponibilite_statut) profile.disponibilite_statut = disponibilite_statut;

    if (profile.disponibilite === false) {
      if (!profile.disponibilite_statut || profile.disponibilite_statut === 'DISPONIBLE') {
        profile.disponibilite_statut = 'ABSENT';
      }
    }

    await profile.save();
    return res.json({ message: 'Disponibilite mise a jour', couturier: profile, disponibilite: profile.disponibilite });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.sub;

    const profile = await Couturier.findOne({ user_id: userId }).populate('user_id', 'name email status');
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    const commandes = await Order.find({ couturier_id: profile._id })
      .populate('client_id', 'name email telephone')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      couturier: profile,
      commandes,
      stats: profile.stats || {},
      disponibilite: profile.disponibilite,
      disponibilite_statut: profile.disponibilite_statut,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ POST /profile/photo (photo de profil)
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.sub;

    let profile = await Couturier.findOne({ user_id: userId });
    
    // Si le profil n'existe pas encore, on le crée avec des valeurs minimales
    if (!profile) {
      profile = new Couturier({
        user_id: userId,
        nom_marque: req.body.nom_marque || 'Nouveau Couturier',
        telephone: req.body.telephone || '00000000',
        adresse: {
          ville: req.body.ville || 'À préciser',
          quartier: req.body.quartier || 'À préciser',
        }
      });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier recu' });

    const photoUrl = getUploadedUrl(file.path || file.filename);
    if (!photoUrl) return res.status(400).json({ message: 'URL photo invalide' });

    const photos = ensureArray(profile.photos);
    const oldMain = photos.find((p) => !!p?.est_principale);

    // Force single main photo
    profile.photos = photos
      .map((p) => ({ ...p, est_principale: false }))
      .concat([
        {
          url: photoUrl,
          public_id: null,
          description: req.body.description || undefined,
          categorie: req.body.categorie || 'AUTRE',
          est_principale: true,
          created_at: new Date(),
        },
      ]);

    await profile.save();

    if (oldMain?.url) await deleteLocalFileIfExists(oldMain.url);

    return res.status(201).json({
      message: 'Photo de profil mise a jour',
      couturier: { _id: profile._id, photo: getMainPhotoUrl(profile.photos) },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ POST /photos (portfolio)
exports.uploadPhotos = async (req, res) => {
  try {
    const userId = req.user.sub;

    const profile = await Couturier.findOne({ user_id: userId });
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'Aucun fichier recu' });

    const categorie = req.body.categorie; // optionnel
    const description = req.body.description; // optionnel

    const photosToAdd = files.map((file, idx) => ({
      url: getUploadedUrl(file.path || file.filename),
      public_id: null,
      description: description || undefined,
      categorie: categorie || 'AUTRE',
      est_principale: idx === 0 && !ensureArray(profile.photos).some((p) => p.est_principale),
      created_at: new Date(),
    }));

    const willHaveMain = photosToAdd.some((p) => p.est_principale);
    if (willHaveMain) {
      await Couturier.updateOne({ _id: profile._id }, { $set: { 'photos.$[].est_principale': false } });
      profile.photos = ensureArray(profile.photos).map((p) => ({ ...p, est_principale: false }));
    }

    profile.photos = ensureArray(profile.photos).concat(photosToAdd);
    await profile.save();

    return res.status(201).json({ message: 'Photos ajoutees', photos: profile.photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ DELETE /photos/:photoId
exports.deletePhoto = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;

    const profile = await Couturier.findOne({ user_id: userId });
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    const photos = ensureArray(profile.photos);
    const index = photos.findIndex((p, i) => {
      if (p?._id) return p._id.toString() === photoId;
      return String(i) === String(photoId);
    });

    if (index === -1) return res.status(404).json({ message: 'Photo non trouvee' });

    const removed = photos.splice(index, 1)[0];

    const hadMain = !!removed?.est_principale;
    if (hadMain && photos.length > 0) {
      photos.forEach((p) => (p.est_principale = false));
      photos[0].est_principale = true;
    }

    profile.photos = photos;
    await profile.save();

    await deleteLocalFileIfExists(removed?.url);

    return res.json({ message: 'Photo supprimee', photos: profile.photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ PUT /photos/:photoId/main
exports.setMainPhoto = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;

    const profile = await Couturier.findOne({ user_id: userId });
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    const photos = ensureArray(profile.photos);
    const index = photos.findIndex((p, i) => {
      if (p?._id) return p._id.toString() === photoId;
      return String(i) === String(photoId);
    });

    if (index === -1) return res.status(404).json({ message: 'Photo non trouvee' });

    photos.forEach((p) => (p.est_principale = false));
    photos[index].est_principale = true;

    profile.photos = photos;
    await profile.save();

    return res.json({ message: 'Photo principale definie', photos: profile.photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ PUT /photos/:photoId
exports.updatePhotoInfo = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { photoId } = req.params;

    const { description, categorie } = req.body;

    const profile = await Couturier.findOne({ user_id: userId });
    if (!profile) return res.status(404).json({ message: 'Profil couturier non trouve' });

    const photos = ensureArray(profile.photos);
    const index = photos.findIndex((p, i) => {
      if (p?._id) return p._id.toString() === photoId;
      return String(i) === String(photoId);
    });

    if (index === -1) return res.status(404).json({ message: 'Photo non trouvee' });

    if (description !== undefined) photos[index].description = description;
    if (categorie !== undefined) photos[index].categorie = categorie;

    profile.photos = photos;
    await profile.save();

    return res.json({ message: 'Infos photo mises a jour', photos: profile.photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /search
exports.searchCouturiers = async (req, res) => {
  try {
    const { q, ville, quartier, disponible } = req.query;

    const query = {};
    if (typeof disponible !== 'undefined') {
      if (disponible === 'true') query.disponibilite = true;
      if (disponible === 'false') query.disponibilite = false;
    }

    // Pour ville/quartier, on applique aussi la version "sans accents".
    if (ville) {
      const villeNorm = normalizeText(ville);
      // On cherche pour max. robustesse : original + sans accents.
      const patterns = [String(ville), villeNorm].filter(Boolean);
      query.$and = query.$and || [];
      query.$and.push({
        $or: patterns.map((p) => ({ 'adresse.ville': { $regex: p, $options: 'i' } })),
      });
    }

    if (quartier) {
      const quartierNorm = normalizeText(quartier);
      const patterns = [String(quartier), quartierNorm].filter(Boolean);
      query.$and = query.$and || [];
      query.$and.push({
        $or: patterns.map((p) => ({ 'adresse.quartier': { $regex: p, $options: 'i' } })),
      });
    }

    // MongoDB regex en recherche insensible à la casse (option i) ne suffit pas toujours.
    // On applique donc une version "sans accents" pour augmenter la correspondance.
    const normalizeText = (str) => {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };


    const qNorm = q ? normalizeText(q) : null;

    if (q) {
      const patterns = [q];
      if (qNorm && qNorm.toLowerCase() !== String(q).toLowerCase()) {
        patterns.push(qNorm);
      }

      query.$or = patterns.map((p) => [
        { nom_marque: { $regex: p, $options: 'i' } },
        { telephone: { $regex: p, $options: 'i' } },
        { description: { $regex: p, $options: 'i' } },
        { 'adresse.ville': { $regex: p, $options: 'i' } },
        { 'adresse.quartier': { $regex: p, $options: 'i' } },
      ]).flat();
    }

    const couturiers = await Couturier.find(query)
      .populate('user_id', 'name email status createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      count: couturiers.length,
      couturiers: couturiers.map((c) => ({
        _id: c._id,
        user_id: c.user_id?._id,
        nom_marque: c.nom_marque,
        description: c.description,
        telephone: c.telephone,
        email: c.user_id?.email,
        name: c.user_id?.name,
        status: c.user_id?.status,
        disponibilite: c.disponibilite,
        disponibilite_statut: c.disponibilite_statut,
        adresse: c.adresse,
        tarifs: c.tarifs,
        photos: c.photos,
        photo: getMainPhotoUrl(c.photos),
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /nearby
exports.searchNearby = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000, disponible } = req.query;

    const query = {};
    if (typeof disponible !== 'undefined') {
      if (disponible === 'true') query.disponibilite = true;
      if (disponible === 'false') query.disponibilite = false;
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat et lng requis' });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const maxDistanceNum = Number(maxDistance);

    const couturiers = await Couturier.find({
      ...query,
      localisation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
          $maxDistance: maxDistanceNum,
        },
      },
    })
      .populate('user_id', 'name email status createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      count: couturiers.length,
      couturiers: couturiers.map((c) => ({
        _id: c._id,
        nom_marque: c.nom_marque,
        telephone: c.telephone,
        email: c.user_id?.email,
        name: c.user_id?.name,
        disponibilite: c.disponibilite,
        disponibilite_statut: c.disponibilite_statut,
        adresse: c.adresse,
        tarifs: c.tarifs,
        photos: c.photos,
        photo: getMainPhotoUrl(c.photos),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /top
exports.getTopCouturiers = async (req, res) => {
  try {
    const couturiers = await Couturier.find({ validation_status: 'VALIDE' })
      .sort({ 'stats.note_moyenne': -1, 'stats.nombre_avis': -1 })
      .limit(10)
      .populate('user_id', 'name email status');

    return res.json({
      count: couturiers.length,
      couturiers: couturiers.map((c) => ({
        _id: c._id,
        nom_marque: c.nom_marque,
        telephone: c.telephone,
        email: c.user_id?.email,
        name: c.user_id?.name,
        adresse: c.adresse,
        note_moyenne: c.stats?.note_moyenne ?? 0,
        nombre_avis: c.stats?.nombre_avis ?? 0,
        disponibilite: c.disponibilite,
        photos: c.photos,
        photo: getMainPhotoUrl(c.photos),
        tarifs: c.tarifs,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /:id/tarifs
exports.getTarifsById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Couturier.findById(id).select('tarifs nom_marque telephone adresse disponibilite');
    if (!profile) return res.status(404).json({ message: 'Couturier introuvable' });

    return res.json({
      couturier: {
        _id: profile._id,
        nom_marque: profile.nom_marque,
        telephone: profile.telephone,
        adresse: profile.adresse,
        disponibilite: profile.disponibilite,
      },
      tarifs: profile.tarifs,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /:id/reviews
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ couturier_id: id })
      .populate('client_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      count: reviews.length,
      reviews: reviews.map((r) => ({
        _id: r._id,
        client: r.client_id,
        rating: r.note,
        note: r.note,
        commentaire: r.commentaire,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /:id/photos
exports.getPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Couturier.findById(id).select('photos nom_marque');
    if (!profile) return res.status(404).json({ message: 'Couturier introuvable' });

    const photos = ensureArray(profile.photos);

    return res.json({
      couturier: { _id: profile._id, nom_marque: profile.nom_marque },
      count: photos.length,
      photos,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ GET /:id (profil public)
exports.getCouturierById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Couturier.findById(id).populate('user_id', 'name email status');
    if (!profile) return res.status(404).json({ message: 'Couturier introuvable' });

    const photos = ensureArray(profile.photos);

    return res.json({
      couturier: {
        _id: profile._id,
        user_id: profile.user_id?._id,
        nom_marque: profile.nom_marque,
        description: profile.description,
        telephone: profile.telephone,
        adresse: profile.adresse,
        disponibilite: profile.disponibilite,
        disponibilite_statut: profile.disponibilite_statut,
        tarifs: profile.tarifs,
        services: profile.services,
        horaires: profile.horaires,
        contacts: profile.contacts,
        stats: profile.stats,
        note_moyenne: profile.stats?.note_moyenne ?? 0,
        nombre_avis: profile.stats?.nombre_avis ?? 0,
        photos,
        photo: getMainPhotoUrl(photos),
        user: {
          name: profile.user_id?.name,
          email: profile.user_id?.email,
          status: profile.user_id?.status,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

