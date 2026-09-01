const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, receiptController.getReceipts);
router.post('/', verifyToken, tenantScope, receiptController.createReceipt);

module.exports = router;
