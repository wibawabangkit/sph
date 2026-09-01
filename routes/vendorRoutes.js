const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, vendorController.getVendors);
router.post('/', verifyToken, tenantScope, vendorController.createVendor);

module.exports = router;
