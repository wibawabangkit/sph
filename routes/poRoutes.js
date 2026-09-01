const express = require('express');
const router = express.Router();
const poController = require('../controllers/poController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, poController.getPOs);
router.post('/', verifyToken, tenantScope, poController.createPO);

module.exports = router;
