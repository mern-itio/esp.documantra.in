const mongoose = require('mongoose');

const OrganizationNotificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  // Who triggered this event (optional)
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Optional: show only to specific users
  targetUserIds: [{
    type: mongoose.Schema.Types.ObjectId
  }],

  // Optional: role-based visibility
  targetRoles: [{
    type: String, // OWNER, ADMIN, MEMBER
    index: true
  }],

  type: {
    type: String,
    enum: [
      'ENVELOPE_CREATED',
      'ENVELOPE_COMPLETED',
      'MEMBER_INVITED',
      'MEMBER_JOINED',
      'ROLE_UPDATED',
      'ORG_SETTINGS_UPDATED'
    ],
    required: true
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
  }

}, { timestamps: true });

OrganizationNotificationSchema.index(
  { organizationId: 1, createdAt: -1 }
);

module.exports = mongoose.model(
  'OrganizationNotification',
  OrganizationNotificationSchema
);
