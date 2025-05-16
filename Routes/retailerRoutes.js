const express = require('express');
const router = express.Router();
const retailerController = require('../Controller/retailerController');
const authenticate = require('../middleware/auth');


router.get('/profile', authenticate, retailerController.getProfile);
router.put('/profile', authenticate, retailerController.updateProfile);
router.get('/dashboard', authenticate, retailerController.getDashboardData);

module.exports = router;