const mongoose = require('mongoose');

// Minimal PDF Tool model with required fields
const pdfToolSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general', index: true },
    priority: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const PDFTool = mongoose.model('PDFTool', pdfToolSchema);
module.exports = PDFTool;


