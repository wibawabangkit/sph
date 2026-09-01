const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, quotationController.getQuotations);
router.post('/', verifyToken, tenantScope, quotationController.saveQuotation);
router.patch('/:id/status', verifyToken, tenantScope, quotationController.updateStatus);

module.exports = router;
