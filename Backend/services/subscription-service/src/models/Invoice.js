const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    planTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanTemplate' },
    planName: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    invoiceNumber: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);


