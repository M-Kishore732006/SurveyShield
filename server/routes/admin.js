const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Villages
router.post('/villages', adminController.createVillage);
router.get('/villages', adminController.getVillages);

// Enumerators
router.post('/enumerators', adminController.createEnumerator);
router.get('/enumerators', adminController.getEnumerators);
router.delete('/enumerators/:id', adminController.deleteEnumerator);

// Validation / Flagged Records
router.get('/validation/flagged', adminController.getFlaggedRecords);
router.post('/validation/:id/review', adminController.reviewRecord);

// Reports
router.get('/reports/data', adminController.getReportData);
router.get('/reports/targets', adminController.getReportTargets);

// ML Management
router.post('/ml/train', adminController.trainMLModel);

module.exports = router;
