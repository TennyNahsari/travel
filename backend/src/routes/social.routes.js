const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Public route to get social media links (for footer and landing page)
router.get('/', socialController.getSocialSettings);

// Admin & Operator routes to update social media links
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'OPERATOR'), socialController.updateSocialSettings);

module.exports = router;
