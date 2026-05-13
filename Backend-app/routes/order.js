const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
// const couturierController = require('../controllers/couturier');

const { authenticate, authorize } = require('../middlewares/auth');

// POST /orders → créer une commande (client uniquement)
// router.post('/', authenticate, authorize('client'), orderController.createOrder);

// GET /orders/unread → compter PLANNED (couturier)
// router.get('/unread', authenticate, authorize('couturier'), orderController.getUnreadOrders);

// GET /orders → voir ses commandes (tous les rôles)
router.get('/', authenticate, orderController.getOrders);

// ✅ ROUTES LIVRAISON - AVANT /:id
router.put('/:id/livraison', authenticate, authorize('client'), orderController.setDeliveryMode);
router.put('/:id/livraison/status', authenticate, authorize('couturier'), orderController.updateDeliveryStatus);
router.get('/:id/livraison', authenticate, orderController.getDeliveryDetails);

// GET /orders/:id → détail d'une commande
router.get('/:id', authenticate, orderController.getOrderById);

// PUT /orders/:id/status → mettre à jour le statut (couturier ou admin)
router.put('/:id/status', authenticate, authorize('couturier', 'admin'), orderController.updateStatus);

// PUT /orders/:id → modifier une commande (avant confirmation)
router.put('/:id', authenticate, authorize('client'), orderController.updateOrder);

// POST /orders/:id/review → ajouter une review/notation
router.post('/:id/review', authenticate, authorize('client'), orderController.addReview);

// DELETE /orders/:id → annuler une commande
router.delete('/:id', authenticate, authorize('client', 'admin'), orderController.cancelOrder);

module.exports = router;

