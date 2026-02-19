// routes/couturier.js
const express = require('express');
const router = express.Router();
const couturierController = require('../controllers/couturier');
const { authenticate, authorize } = require('../middlewares/auth');
const { upload, ensureUploadDir } = require('../middlewares/upload');

// ========== ROUTES PUBLliQUES ==========

// Recherche
router.get('/search', couturierController.searchCouturiers);
router.get('/nearby', couturierController.searchNearby);

// Profil public + photos
router.get('/:id', couturierController.getCouturierById);
router.get('/:id/photos', couturierController.getPhotos); // Voir photos d'un couturier

// ========== ROUTES PROTÉGÉES (Couturier uniquement) ==========

// Profil
router.post('/profile', authenticate, authorize('couturier'), couturierController.createProfile);
router.get('/profile/me', authenticate, authorize('couturier'), couturierController.getMyProfile);
router.put('/profile/me', authenticate, authorize('couturier'), couturierController.updateProfile);
router.put('/availability', authenticate, authorize('couturier'), couturierController.setAvailability);

// ✅ Gestion des photos (NOUVEAU)
router.post(
  '/photos',
  authenticate,
  authorize('couturier'),
  ensureUploadDir,
  upload.array('photos', 5), // Max 5 photos
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

module.exports = router;