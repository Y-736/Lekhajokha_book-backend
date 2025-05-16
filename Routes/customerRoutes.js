const express = require('express');
const router = express.Router();
const customerController = require('../Controller/customerController');
const authenticate = require('../middleware/auth');


router.post('/customers', authenticate, customerController.addCustomer);
router.get('/customers', authenticate, customerController.getCustomers);
router.get('/customers/:id', authenticate, customerController.getCustomer);

module.exports = router;