const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client');
const { authenticate, authorize } = require('../middlewares/auth');

// Toutes les routes sont protégées (client uniquement)
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