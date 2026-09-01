const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, companyController.getCompanies);
router.get('/:id', verifyToken, companyController.getCompanyById);
router.post('/', verifyToken, requireRole('SUPER_ADMIN'), companyController.createCompany);
router.put('/:id', verifyToken, companyController.updateCompany);

module.exports = router;
