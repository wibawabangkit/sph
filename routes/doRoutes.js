const express = require('express');
const router = express.Router();
const doController = require('../controllers/doController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, doController.getDOs);
router.post('/', verifyToken, tenantScope, doController.createDO);

module.exports = router;
