const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const transactionController = require('../Controller/transactionController');


router.get('/transactions', authenticate, transactionController.getTransactions);


router.post('/transactions', authenticate, transactionController.addTransaction);
router.put('/transactions/:id', authenticate, transactionController.updateTransactionStatus);

module.exports = router;