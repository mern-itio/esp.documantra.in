const mongoose = require('mongoose');

const activationSchema = new mongoose.Schema({
  toolId: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String, default: 'system' }
}, { timestamps: true });

const PDFToolActivation = mongoose.model('PDFToolActivation', activationSchema);
module.exports = PDFToolActivation;


