// models/Envelope.js
const mongoose = require('mongoose');

const CompletionCertificateSchema = new mongoose.Schema({
  filename: { type: String },
  path: { type: String },   // server filesystem path (if stored locally)
  url: { type: String },    // external URL (S3, CDN, signed URL), prefer this in prod
  mimeType: { type: String, default: 'application/pdf' },
  size: { type: Number },   // bytes
  storage: { type: String, enum: ['local', 's3', 'gridfs', 'other'], default: 'local' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false }); // embed only, no separate id

// --- NEW: Party Slot schema ---
const PartySlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true },       // e.g. "slot_1"
  index: { type: Number, required: true },        // signing order index
  label: { type: String },                        // display label ("Party A")
  role: { type: String, default: "signer" },      // role of the slot
  authMethod: { type: String, default: "email" }, // email, sms, etc.
  required: { type: Boolean, default: true }      // is this slot mandatory
}, { _id: false });

const EnvelopeSchema = new mongoose.Schema({
  subject: { type: String },
  message: { type: String },
  envelopetype: { type: String },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  priority: { type: String, enum: ["low", "normal", "high", "urgent","power-form"], default: "normal" },
  signingOrder: { type: String, enum: ["In-Order", "Parallel", "sequential"], default: "In-Order" },
  expirationDate: { type: Date },
  expirationAlertDays: { type: Number, default: 0 }, // days before expiration to send alert
  isReminder: { type: Boolean, default: false },
  reminderInterval: { type: Number }, // in days
  isAll: { type: Boolean, default: false }, // require all signers to sign
  canDecline: { type: Boolean, default: true },
  documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipient" }],
  signatureType: { type: String, enum: ["standard", "advanced", "qualified"], default: "standard" },
  status: { type: String, enum: ["draft", "in-progress", "completed", "archived", "active", "inactive", "deleted"], default: "draft" },
  // NEW FLAG
  isPowerForm: { type: Boolean, default: false },   // <--- mark if this is a PowerForm
  // NEW FIELDS for PowerForm slots
  slots: { type: [PartySlotSchema], default: [] },   // slot definitions
  creatorSlotId: { type: String },                   // which slot creator is
  firstSigningSlotId: { type: String },              // which slot signs first
  numberOfParties: { type: Number, default: 1 },
  powerFormId: { type: String, default: null },               // if linked to a PowerForm template
  // NEW FIELD: completion certificate metadata
  completionCertificate: { type: CompletionCertificateSchema, default: null },
  // Scheduling fields
  isScheduled: { type: Boolean, default: false },
  scheduledDate: { type: Date }, // Combined date and time for when to send
  scheduledTime: { type: String } // Optional separate time field for UI convenience

}, { timestamps: true });

module.exports = mongoose.model('Envelope', EnvelopeSchema);
