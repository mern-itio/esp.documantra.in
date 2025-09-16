// services/activityLogService.js
const { ActivityLogs } = require("../models/ActivityLogs");

/**
 * Log an activity for an envelope.
 * @param {string} envelopeId - Envelope ObjectId as string
 * @param {string} action - Action name (e.g., ENVELOPE_CREATED)
 * @param {"Sender"|"Recipient"} type - Who performed the action
 * @param {Object} [details] - Optional additional info
 */
const logActivity = async (envelopeId, action, type, details) => {
  await ActivityLogs.create({
    envelopeId,
    action,
    type,
    details,
    timestamp: new Date(),
  });
};

module.exports = { logActivity };
