const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.post('/impersonate/:targetUserId', verifyToken, requireRole('SUPER_ADMIN'), authController.impersonate);
router.post('/stop-impersonate', verifyToken, authController.stopImpersonate);

module.exports = router;
