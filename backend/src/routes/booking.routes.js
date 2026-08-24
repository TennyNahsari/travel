const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Public routes for guest booking from website (no login required)
router.get('/schedules/available', bookingController.getAvailableSchedules);
router.get('/schedules/:scheduleId/seats', bookingController.getAvailableSeats);
router.post('/public', bookingController.createPublicBooking);
router.get('/public/code/:bookingCode', bookingController.getPublicBookingByCode);
router.post('/public/confirm-payment', bookingController.submitPaymentConfirmation);

// All other routes require authentication
router.use(authMiddleware);

// Get all bookings (customers see their own, admin/operator see all)
router.get('/', bookingController.getBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Create booking (all authenticated users can create)
router.post('/', bookingController.createBooking);

// Update booking status (only ADMIN and OPERATOR)
router.put('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), bookingController.updateBooking);

// Cancel booking (all authenticated users can cancel their own)
router.delete('/:id/cancel', bookingController.cancelBooking);

// Delete booking permanently (only ADMIN and OPERATOR)
router.delete('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), bookingController.deleteBooking);

module.exports = router;
