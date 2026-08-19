const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const crossSurveyController = require('../controllers/crossSurveyController');

router.post('/analyze', authMiddleware, crossSurveyController.analyze);
router.get('/results', authMiddleware, crossSurveyController.getResults);
router.get('/summary', authMiddleware, crossSurveyController.getSummary);

module.exports = router;
