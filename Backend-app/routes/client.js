const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client');
const { authenticate, authorize } = require('../middlewares/auth');

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

// Adresses
router.post('/addresses', clientController.addAddress);
router.delete('/addresses/:addressId', clientController.removeAddress);

// Mesures
router.put('/measurements', clientController.updateMeasurements);
router.get('/measurements', clientController.getMeasurements);

// Compte
router.delete('/deactivate', clientController.deactivateAccount);

module.exports = router;