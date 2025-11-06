const mongoose = require('mongoose');

const EnvelopeTypeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EnvelopeType', EnvelopeTypeSchema);

