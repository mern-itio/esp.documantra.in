// models/Recipient.js
const mongoose = require('mongoose'); 

const RecipientSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, default:null },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  title: { type: String, default: '' },
  company: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: null },
  signature: {type: String, default: null},
  initials: { type: String, default: null },
}, { timestamps: true });
// Virtual to fetch envelope-specific permissions
RecipientSchema.virtual('permissions', {
  ref: 'RecipientPermission',
  localField: '_id',
  foreignField: 'recipientId',
});

RecipientSchema.set('toObject', { virtuals: true });
RecipientSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Recipient', RecipientSchema);
