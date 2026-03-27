const mongoose = require('mongoose');

const UserNotificationSchema = new mongoose.Schema({
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['AUTH', 'ORG', 'ESIGN', 'USER'],
    required: true
  },

  type: {
    type: String,
    required: true
    /*
      Examples:
      - ORG_INVITATION
      - ORG_JOINED
      - ORG_ROLE_UPDATED
      - PASSWORD_CHANGED
      - SECURITY_ALERT
    */
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  metadata: {
    type: Object
    /*
      organizationId
      inviteId
      envelopeId
      redirectUrl
    */
  },

  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  readAt: {
    type: Date
  }

}, { timestamps: true });

UserNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model(
  'Notification',
  UserNotificationSchema
);
