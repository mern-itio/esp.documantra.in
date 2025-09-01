const express = require('express');
const multer = require('multer');
const path = require('path');
const calculateFieldsController = require('../controllers/calculateFieldsController');

const router = express.Router();

// Configure multer for PDF file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Routes

// POST /add-calculations - Add calculations to form fields
router.post('/add-calculations', upload.single('pdf'), calculateFieldsController.addCalculations);

// POST /get-form-fields - Get form fields for calculation setup
router.post('/get-form-fields', upload.single('pdf'), calculateFieldsController.getFormFields);

// POST /validate-formula - Validate calculation formula
router.post('/validate-formula', calculateFieldsController.validateFormula);

// GET /templates - Get calculation templates
router.get('/templates', calculateFieldsController.getCalculationTemplates);

// GET /status - Get service status
router.get('/status', calculateFieldsController.getServiceStatus);

module.exports = router;
