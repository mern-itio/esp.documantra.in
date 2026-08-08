const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const PlanTemplate = require('../models/PlanTemplate');
const PDFDocument = require('pdfkit');

// Helper to extract userId from verified JWT (align with other controllers)
const getUserIdFromRequest = (req) => {
  try {
    const decoded = req.user || {};
    return decoded?.data?.id || decoded?.id || decoded?._id || decoded?.data?._id || null;
  } catch (_) {
    return null;
  }
};
const createInvoiceForCreditPurchase = async (userId, creditPackage) => {
  if(!userId || !creditPackage){
    throw new Error('Invalid parameters for invoice creation');
  }
    const now = new Date();

  // Simple invoice / receipt numbering scheme
  const seq = Math.floor(now.getTime() / 1000);
  const invoiceNumber = `INV-${seq}`;
  const receiptNumber = `RCT-${seq}`;
  const invoice = await Invoice.create({
    userId,
    creditPackageId: creditPackage._id,
    planName: creditPackage.name,
    amount:creditPackage?.price,
    currency:creditPackage?.currency,
    invoiceNumber,
    receiptNumber
  });
  return invoice;
  
}
const createInvoiceForFlexiCreditPurchase = async (userId, flexiPackage,metadata) => {
  if(!userId || !flexiPackage || !metadata){
    throw new Error('Invalid parameters for invoice creation');
  }
    const now = new Date();

  // Simple invoice / receipt numbering scheme
  const seq = Math.floor(now.getTime() / 1000);
  const invoiceNumber = `INV-${seq}`;
  const receiptNumber = `RCT-${seq}`;
  const invoice = await Invoice.create({
    userId,
    creditPackageId: flexiPackage._id,
    planName: flexiPackage.name,
    amount:metadata?.creditPricing,
    currency:flexiPackage?.currency || 'USD',
    invoiceNumber,
    receiptNumber
  });
  return invoice;
  
}
// Internal helper to create an invoice when a user upgrades a plan
const createInvoiceForUpgrade = async ({ userId, subscription, planTemplate }) => {
  if (!userId || !subscription || !planTemplate) return null;

  const now = new Date();

  // Simple invoice / receipt numbering scheme
  const seq = Math.floor(now.getTime() / 1000);
  const invoiceNumber = `INV-${seq}`;
  const receiptNumber = `RCT-${seq}`;

  const invoice = await Invoice.create({
    userId,
    subscriptionId: subscription._id,
    planTemplateId: planTemplate._id,
    planName: planTemplate.name,
    periodStart: subscription.periodStart,
    periodEnd: subscription.periodEnd,
    amount: planTemplate.pricePerPeriod || 0,
    currency: planTemplate.currency || 'USD',
    invoiceNumber,
    receiptNumber,
  });

  return invoice;
};

// GET /invoices/me - list invoices for the authenticated user
const listMyInvoices = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const invoices = await Invoice.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: 200,
      message: 'Invoices fetched',
      data: invoices,
    });
  } catch (err) {
    console.error('listMyInvoices error:', err);
    return res
      .status(500)
      .json({ status: 500, message: err.message || 'Server error', data: null });
  }
};

// GET /invoices/latest - latest invoice for current user
const getLatestInvoice = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const invoice = await Invoice.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!invoice) {
      return res.status(200).json({
        status: 200,
        message: 'No invoices found',
        data: null,
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Latest invoice fetched',
      data: invoice,
    });
  } catch (err) {
    console.error('getLatestInvoice error:', err);
    return res
      .status(500)
      .json({ status: 500, message: err.message || 'Server error', data: null });
  }
};

// GET /invoices/:id - invoice details (basic)
const getInvoiceById = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, userId }).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ status: 404, message: 'Invoice not found', data: null });
    }

    return res.status(200).json({
      status: 200,
      message: 'Invoice fetched',
      data: invoice,
    });
  } catch (err) {
    console.error('getInvoiceById error:', err);
    return res
      .status(500)
      .json({ status: 500, message: err.message || 'Server error', data: null });
  }
};

// Helper: generate an invoice/receipt PDF buffer with a layout similar to Stripe-style docs
const generateInvoicePdfBuffer = (invoice, type = 'invoice') =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const isReceipt = type === 'receipt';

      // Header title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(isReceipt ? 'Receipt' : 'Invoice', 50, 40);

      doc.moveDown();

      // Top meta section
      const leftX = 50;
      const rightX = 320;
      const topY = 90;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice number', leftX, topY);
      doc
        .font('Helvetica')
        .text(invoice.invoiceNumber || String(invoice._id || ''), leftX, topY + 12);

      if (isReceipt) {
        doc.font('Helvetica-Bold').text('Date paid', leftX, topY + 32);
      } else {
        doc.font('Helvetica-Bold').text('Date of issue', leftX, topY + 32);
      }
      const dateStr = invoice.createdAt
        ? new Date(invoice.createdAt).toLocaleDateString()
        : '';
      doc.font('Helvetica').text(dateStr, leftX, topY + 44);

      if (!isReceipt) {
        doc.font('Helvetica-Bold').text('Date due', leftX, topY + 64);
        doc.font('Helvetica').text(dateStr, leftX, topY + 76);
      }

      // Company (Cursor) block
      doc
        .font('Helvetica-Bold')
        .text(process.env.APP_NAME || 'DocuMantra', rightX, topY);
      doc
        .font('Helvetica')
        .text('ITIO Innovex Pvt Ltd', rightX, topY + 12)
        .text('Kaushambi, Ghaziabad, Uttar Pradesh', rightX, topY + 24)
        .text('India', rightX, topY + 36)
        .text('+91 12345-67890', rightX, topY + 48)
        .text(process.env.BRAND_CONTACT_EMAIL || process.env.SUPPORT_EMAIL || 'connect@documantra.in', rightX, topY + 60);

      // Divider
      doc.moveTo(50, 190).lineTo(545, 190).strokeColor('#dddddd').stroke();

      // Amount line
      const amount = Number(invoice.amount || 0);
      const currency = invoice.currency || 'USD';
      const amountStr = `${currency} ${amount.toFixed(2)}`;

      doc.moveDown().fontSize(12).font('Helvetica-Bold');
      if (isReceipt) {
        doc.text(`${amountStr} paid on ${dateStr}`, 50, 205);
      } else {
        doc.text(`${amountStr} due ${dateStr}`, 50, 205);
      }

      doc.moveDown(2);

      // Line items header
      const tableTop = 250;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Qty', 350, tableTop, { width: 50, align: 'right' })
        .text('Unit price', 400, tableTop, { width: 80, align: 'right' })
        .text('Amount', 480, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#dddddd').stroke();

      // Single line item for the subscription period
      const rowTop = tableTop + 24;
      const planName = invoice.planName || 'Cursor Pro';
      const periodStart = invoice.periodStart
        ? new Date(invoice.periodStart).toLocaleDateString()
        : '';
      const periodEnd = invoice.periodEnd
        ? new Date(invoice.periodEnd).toLocaleDateString()
        : '';
      const periodLabel =
        periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : '';

      doc
        .font('Helvetica')
        .text(planName, 50, rowTop)
        .fontSize(9)
        .fillColor('#555555')
        .text(periodLabel, 50, rowTop + 14);

      doc
        .fontSize(10)
        .fillColor('#000000')
        .text('1', 350, rowTop, { width: 50, align: 'right' })
        .text(amountStr, 400, rowTop, { width: 80, align: 'right' })
        .text(amountStr, 480, rowTop, { width: 80, align: 'right' });

      // Subtotal / Total
      const summaryTop = rowTop + 60;
      doc
        .font('Helvetica')
        .text('Subtotal', 400, summaryTop, { width: 80, align: 'right' })
        .text(amountStr, 480, summaryTop, { width: 80, align: 'right' })
        .font('Helvetica-Bold')
        .text(isReceipt ? 'Total' : 'Amount due', 400, summaryTop + 14, {
          width: 80,
          align: 'right',
        })
        .text(amountStr, 480, summaryTop + 14, { width: 80, align: 'right' });

      if (isReceipt) {
        // Simple Payment history section label
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Payment history', 50, summaryTop + 60);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Payment method', 50, summaryTop + 82)
          .text('Date', 250, summaryTop + 82)
          .text('Amount paid', 350, summaryTop + 82)
          .text('Receipt number', 450, summaryTop + 82);

        doc
          .font('Helvetica')
          .text('Card ••••', 50, summaryTop + 96)
          .text(dateStr, 250, summaryTop + 96)
          .text(amountStr, 350, summaryTop + 96)
          .text(invoice.receiptNumber || '', 450, summaryTop + 96);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

// GET /invoices/:id/download - invoice PDF download
const downloadInvoice = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, userId }).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ status: 404, message: 'Invoice not found', data: null });
    }

    const filename = `invoice-${invoice.invoiceNumber || invoice._id}.pdf`;
    const buffer = await generateInvoicePdfBuffer(invoice, 'invoice');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('downloadInvoice error:', err);
    return res
      .status(500)
      .json({ status: 500, message: err.message || 'Server error', data: null });
  }
};

// GET /invoices/:id/receipt - receipt PDF download
const downloadReceipt = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, userId }).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ status: 404, message: 'Invoice not found', data: null });
    }

    const filename = `receipt-${invoice.receiptNumber || invoice._id}.pdf`;
    const buffer = await generateInvoicePdfBuffer(invoice, 'receipt');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('downloadReceipt error:', err);
    return res
      .status(500)
      .json({ status: 500, message: err.message || 'Server error', data: null });
  }
};

module.exports = {
  createInvoiceForUpgrade,
  listMyInvoices,
  getLatestInvoice,
  getInvoiceById,
  downloadInvoice,
  downloadReceipt,
  createInvoiceForCreditPurchase,
  createInvoiceForFlexiCreditPurchase
};


