const express = require('express');
const {
  listMyInvoices,
  getLatestInvoice,
  getInvoiceById,
  downloadInvoice,
  downloadReceipt,
} = require('../controllers/invoiceController');

const router = express.Router();

// List all invoices for current user
router.get('/me', listMyInvoices);

// Latest invoice for current user
router.get('/latest', getLatestInvoice);

// Invoice details
router.get('/:id', getInvoiceById);

// Downloads
router.get('/:id/download', downloadInvoice);
router.get('/:id/receipt', downloadReceipt);

module.exports = router;


