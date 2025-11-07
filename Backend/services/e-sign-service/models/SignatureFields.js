const mongoose = require('mongoose');

const SignatureFields = new mongoose.Schema({
  envelopeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Envelope", 
    index: true, 
    required: true 
  },
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Document", 
    index: true, 
    required: true 
  },

  // Either tied to a Recipient or to a PowerForm slot
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Recipient", 
    index: true, 
    default: null 
  },
  slotId: { 
    type: String, 
    index: true, 
    default: null 
  },

  page: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },

  // --- Strict typing ---
  type: {
    type: String,
    // Align with frontend/editor field types
    enum: [
      "signature",
      "initial", // was "initials"; accept singular used by frontend
      "stamp",
      "date",
      "name",
      "email",
      "company",
      "title",
      "text",
      "number",
      "checkbox",
      // keep compatibility with other services
      "phone",
      "dropdown",
      "input"
    ],
    required: true
  },

  // Displayed name (dynamic)
  label: { 
    type: String, 
    default: "" 
  },
  fieldId:{
    type: String,
    default:""
  },

  // Status
  status: { 
    type: String, 
    enum: ["pending", "completed", "declined", "submitted"], 
    default: "pending" 
  },

  signature: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model("SignatureFields", SignatureFields);
