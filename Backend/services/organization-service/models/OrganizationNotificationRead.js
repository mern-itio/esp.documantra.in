const mongoose = require('mongoose');

const OrganizationNotificationReadSchema = new mongoose.Schema({
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrganizationNotification',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

OrganizationNotificationReadSchema.index(
  { notificationId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'OrganizationNotificationRead',
  OrganizationNotificationReadSchema
);
