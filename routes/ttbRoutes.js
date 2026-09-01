const express = require('express');
const router = express.Router();
const ttbController = require('../controllers/ttbController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, ttbController.getTTBs);
router.post('/', verifyToken, tenantScope, ttbController.createTTB);

module.exports = router;
