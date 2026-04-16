const express = require('express');
const router = express.Router();
const couturierController = require('../controllers/couturier');
const { authenticate, authorize } = require('../middlewares/auth');
const { upload, ensureUploadDir } = require('../middlewares/upload');

// ========== ROUTES PROTÉGÉES (Couturier uniquement) ==========
// ✅ METTRE AVANT les routes publiques avec /:id

// Profil
router.post('/profile', authenticate, authorize('couturier'), couturierController.createProfile);
router.get('/profile/me', authenticate, authorize('couturier'), couturierController.getMyProfile);
router.put('/profile/me', authenticate, authorize('couturier'), couturierController.updateProfile);
router.put('/availability', authenticate, authorize('couturier'), couturierController.setAvailability);

// ✅ Gestion des photos - AVANT les routes avec /:id
router.post(
  '/photos',
  authenticate,
  authorize('couturier'),
  ensureUploadDir,
  upload.array('photos', 5),
  couturierController.uploadPhotos
);

router.delete(
  '/photos/:photoId',
  authenticate,
  authorize('couturier'),
  couturierController.deletePhoto
);

router.put(
  '/photos/:photoId/main',
  authenticate,
  authorize('couturier'),
  couturierController.setMainPhoto
);

router.put(
  '/photos/:photoId',
  authenticate,
  authorize('couturier'),
  couturierController.updatePhotoInfo
);

// ========== ROUTES PUBLIQUES ==========
// ✅ APRÈS les routes spécifiques

// Recherche
router.get('/search', couturierController.searchCouturiers);
router.get('/nearby', couturierController.searchNearby);

// ✅ NOUVEAU: Meilleurs couturiers (pour page d'accueil)
router.get('/top', couturierController.getTopCouturiers);

// ✅ NOUVEAU: Tarifs publics (POUR FORMULAIRE COMMANDE) - AVANT /:id
router.get('/:id/tarifs', couturierController.getTarifsById);

// Profil public + photos - DERNIER car /:id capture tout
router.get('/:id/photos', couturierController.getPhotos);
router.get('/:id', couturierController.getCouturierById);

module.exports = router;