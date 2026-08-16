const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const surveyController = require('../controllers/surveyController');

const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

// Upload Survey Data CSV
router.post('/upload', upload.single('file'), surveyController.uploadSurveyData);
router.get('/', surveyController.getSurveys);

module.exports = router;
