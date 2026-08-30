const express = require('express');
const router = express.Router();
const charterController = require('../controllers/charter.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Public routes for guest charter booking from landing page
router.get('/check-availability', charterController.checkAvailability);
router.post('/public', charterController.createCharter);
router.get('/public/code/:code', charterController.getCharterByCode);
router.post('/public/confirm-payment/:id', charterController.submitPaymentProof);

// Authenticated routes
router.use(authMiddleware);

// Get all charters
router.get('/', charterController.getCharters);

// Update charter status (Admin & Operator)
router.put('/:id/status', roleMiddleware(['ADMIN', 'OPERATOR']), charterController.updateCharterStatus);
router.patch('/:id/status', roleMiddleware(['ADMIN', 'OPERATOR']), charterController.updateCharterStatus);
router.put('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), charterController.updateCharterStatus);

// Get charter by ID/Code
router.get('/:code', charterController.getCharterByCode);

// Create charter (authenticated user)
router.post('/', charterController.createCharter);

// Submit payment proof
router.post('/:id/payment', charterController.submitPaymentProof);

// Delete charter (Admin & Operator)
router.delete('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), charterController.deleteCharter);

module.exports = router;
