const mongoose = require('mongoose');

const OAuthStateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  serviceId: {
    type: String,
    required: true,
    enum: ['gdrive', 'dropbox', 'onedrive', 'box', 'icloud']
  },
  state: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Expires after 1 hour
  }
});

// Static method to find and delete OAuth state
OAuthStateSchema.statics.findAndDelete = async function(state) {
  const oauthState = await this.findOne({ state });
  if (oauthState) {
    await this.deleteOne({ state });
  }
  return oauthState;
};

module.exports = mongoose.model('OAuthState', OAuthStateSchema);
