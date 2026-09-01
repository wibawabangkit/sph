const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, invoiceController.getInvoices);
router.post('/', verifyToken, tenantScope, invoiceController.createInvoice);

module.exports = router;
