const mongoose = require('mongoose');
const CreditPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  credits: { type: Number, default: 0, required: true },
  price: {  type: Number, default: 0, required: true },
  currency: {type: String, default: 'USD'},
  isRecommended: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CreditPackage', CreditPackageSchema);