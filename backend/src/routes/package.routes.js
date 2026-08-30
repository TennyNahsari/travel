const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Public routes for guest package booking from landing page
router.get('/check-availability', packageController.checkAvailability);
router.post('/public', packageController.createPackageBooking);
router.get('/public/code/:code', packageController.getPackageByCode);
router.post('/public/confirm-payment/:id', packageController.submitPaymentProof);

// Authenticated routes
router.use(authMiddleware);

// Get all package bookings
router.get('/', packageController.getPackages);

// Update package status (Admin & Operator)
router.put('/:id/status', roleMiddleware(['ADMIN', 'OPERATOR']), packageController.updatePackageStatus);
router.patch('/:id/status', roleMiddleware(['ADMIN', 'OPERATOR']), packageController.updatePackageStatus);
router.put('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), packageController.updatePackageStatus);

// Get package by ID/Code
router.get('/:code', packageController.getPackageByCode);

// Create package (authenticated user)
router.post('/', packageController.createPackageBooking);

// Submit payment proof
router.post('/:id/payment', packageController.submitPaymentProof);

// Delete package (Admin & Operator)
router.delete('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), packageController.deletePackage);

module.exports = router;
