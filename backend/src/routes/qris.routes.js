const express = require('express');
const router = express.Router();
const qrisController = require('../controllers/qris.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Public route to get QRIS configuration (for booking & check status)
router.get('/', qrisController.getQris);

// Admin & Operator routes for updating/deleting QRIS
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'OPERATOR'), qrisController.updateQris);
router.delete('/', authMiddleware, roleMiddleware('ADMIN', 'OPERATOR'), qrisController.deleteQris);

module.exports = router;
