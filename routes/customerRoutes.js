const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, customerController.getCustomers);
router.post('/', verifyToken, tenantScope, customerController.createCustomer);
router.put('/:id', verifyToken, tenantScope, customerController.updateCustomer);
router.delete('/:id', verifyToken, tenantScope, customerController.deleteCustomer);

module.exports = router;
