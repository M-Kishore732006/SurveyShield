const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(authMiddleware, adminMiddleware);

// Generate PDF Report for a Village
router.get('/village/:villageId/pdf', reportController.generateVillageReportPDF);

module.exports = router;
