const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadClients, ensureUploadDir } = require('../middlewares/upload');


// ✅ Route pour obtenir un client par userId (accessible aux couturiers connectés)
router.get('/user/:userId', authenticate, clientController.getClientByUserId);

// ✅ Route pour obtenir un couturier par userId (accessible aux clients connectés)
router.get('/couturier/user/:userId', authenticate, clientController.getCouturierByUserId);

// Toutes les routes suivantes sont protégées (client uniquement)
router.use(authenticate, authorize('client'));

// Profil
router.post('/profile', clientController.createProfile);
router.get('/profile/me', clientController.getMyProfile);
router.put('/profile/me', clientController.updateProfile);

// Photo de profil
router.post(
  '/profile/photo',
  ensureUploadDir,
  uploadClients.single('photo'),
  clientController.uploadProfilePhoto
);
router.delete('/profile/photo', clientController.deleteProfilePhoto);


// Adresses
router.post('/addresses', clientController.addAddress);
router.delete('/addresses/:addressId', clientController.removeAddress);

// Mesures
router.put('/measurements', clientController.updateMeasurements);
router.get('/measurements', clientController.getMeasurements);

// Compte
router.delete('/deactivate', clientController.deactivateAccount);

module.exports = router;