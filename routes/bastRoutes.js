const express = require('express');
const router = express.Router();
const bastController = require('../controllers/bastController');
const { verifyToken, tenantScope } = require('../middleware/authMiddleware');

router.get('/', verifyToken, tenantScope, bastController.getBASTs);
router.post('/', verifyToken, tenantScope, bastController.createBAST);

module.exports = router;
