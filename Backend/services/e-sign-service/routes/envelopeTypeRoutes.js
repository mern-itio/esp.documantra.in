const express = require('express');
const {
  getAllEnvelopeTypes,
  getEnvelopeTypeById,
  createEnvelopeType,
  updateEnvelopeType,
  deleteEnvelopeType
} = require('../controllers/envelopeTypeController');

const router = express.Router();

// All routes require authentication
router.get('/', getAllEnvelopeTypes);
router.get('/:id', getEnvelopeTypeById);
router.post('/', createEnvelopeType);
router.put('/:id', updateEnvelopeType);
router.delete('/:id', deleteEnvelopeType);

module.exports = router;

