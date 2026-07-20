const mongoose = require('mongoose');

const creditRangeSchema = new mongoose.Schema({
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  pricePerCredit: {
    type: Number,
    required: true
  }
}, { _id: false });

const flexibleCreditPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ''
  },

  ranges: [creditRangeSchema],

  currency: {
    type: String,
    default: 'INR',
  },

}, { timestamps: true });

module.exports = mongoose.model('flexibleCreditPackage', flexibleCreditPackageSchema);