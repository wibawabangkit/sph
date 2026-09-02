const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireRole('SUPER_ADMIN'), userController.getUsers);
router.post('/', verifyToken, requireRole('SUPER_ADMIN'), userController.createUser);
router.put('/:id', verifyToken, requireRole('SUPER_ADMIN'), userController.updateUser);
router.patch('/:id/status', verifyToken, requireRole('SUPER_ADMIN'), userController.updateUserStatus);
router.delete('/:id', verifyToken, requireRole('SUPER_ADMIN'), userController.deleteUser);

module.exports = router;
