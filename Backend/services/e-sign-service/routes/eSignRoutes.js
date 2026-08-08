const express = require('express');
const { Upload, insertRecipient,updateEnvelope,saveSignatureFields } = require('../controllers/eSignController');
const { 
         envelopesData,
         envelopesDetail, 
         getEnvelopeStats,
         envelopExists,
         sendEnvelope,
         scheduleEnvelope,
         processScheduledEnvelopesHandler,
         processAutoRemindersHandler,
         addSignature,
         getRecipientByEmail,
         envelopeArchive,
         envelopeDelete,
         envelopePermanentDelete,
         envelopeReminder,
         duplicateEnvelope,
         activityLogs,
         removeRecFromEnvelope,
         removeDocFromEnvelope,
         getEnvSignFields,
         removeDocSignField,
         connectPowerForm,
         getSigners,getAllEnvelopeStats,getAllRecipients,
         getNotifications,
         markNotificationAsRead,
         markAllNotificationsAsRead,
         fetchBulkEnvelopes,
         getEnvelopesExcludingIds,
         downloadCompletionZip  } = require('../controllers/mainController');
const {
  listEnvelopeCommentsForSender,
  resolveEnvelopeCommentBySender,
  replyToEnvelopeCommentBySender,
} = require('../controllers/envelopeCommentController');
const { listRecipients, createRecipient, updateRecipient, deleteRecipient } = require('../controllers/recipientController');
const { upload } = require('../utils/secureUpload');
const { viewDocument } = require('../controllers/documentViewController');
const requireTwoFaForSensitiveActions = require('../middleware/requireTwoFaForSensitiveActions');
const { claimGuestEnvelopes } = require('../controllers/publicSentController');
const {
  requireAuthenticatedEnvelopeAccess,
} = require('../middleware/envelopeAccessMiddleware');

const router = express.Router();
const readAccess = requireAuthenticatedEnvelopeAccess();
const senderAccess = requireAuthenticatedEnvelopeAccess({ requireSender: true });
const optionalSenderUpload = requireAuthenticatedEnvelopeAccess({ fromBody: true, optional: true, requireSender: true });

router.get('/health', (_, res) => res.send('E-Sign Private Service is running...'));
router.post('/upload', optionalSenderUpload, upload.array('files'), Upload);
router.post('/add-recipients', requireAuthenticatedEnvelopeAccess({ fromBody: true, requireSender: true }), insertRecipient);
router.post('/save-signature-fields', requireAuthenticatedEnvelopeAccess({ fromBody: true, requireSender: true }), saveSignatureFields);
router.post('/update-envelope', requireAuthenticatedEnvelopeAccess({ fromBody: true, requireSender: true }), updateEnvelope);
router.post('/add-signature', addSignature);
router.get('/get-envelopes', envelopesData);
router.post('/claim-guest-envelopes', claimGuestEnvelopes);
router.get('/get-all-recipients',getAllRecipients);
router.get('/documents/:documentId/view', viewDocument);
router.get('/envelope/:id', readAccess, envelopesDetail);
router.get('/envelope-exist/:id', envelopExists);
router.get('/analytics/envelope-stats', getEnvelopeStats);
router.post('/send-envelope/:envelopeId', senderAccess, requireTwoFaForSensitiveActions, sendEnvelope);
router.post('/schedule-envelope/:envelopeId', senderAccess, scheduleEnvelope);
router.post('/process-scheduled-envelopes', processScheduledEnvelopesHandler);
router.post('/process-auto-reminders', processAutoRemindersHandler);
router.get('/get-recipient/:email',getRecipientByEmail);
router.post('/envelope/archive/:envelopeId', senderAccess, envelopeArchive);
router.post('/envelope/delete/:envelopeId', senderAccess, envelopeDelete);
router.post('/envelope/permanent-delete/:envelopeId', senderAccess, envelopePermanentDelete);
router.post('/envelope/reminder/:envelopeId', senderAccess, envelopeReminder);
router.get('/envelope/duplicate/:envelopeId', senderAccess, duplicateEnvelope);
router.get('/envelope/activity-log/:envelopeId', readAccess, activityLogs);
router.get('/envelope/:envelopeId/comments', readAccess, listEnvelopeCommentsForSender);
router.patch('/envelope/:envelopeId/comments/:commentId/resolve', senderAccess, resolveEnvelopeCommentBySender);
router.post('/envelope/:envelopeId/comments/:commentId/reply', senderAccess, replyToEnvelopeCommentBySender);
router.post('/envelope/remove-recipient/:recipientId/:envelopeId', senderAccess, removeRecFromEnvelope);
router.post('/envelope/remove-document/:documentId/:envelopeId', senderAccess, removeDocFromEnvelope);
router.get('/envelope/get-signature-fields/:envelopeId', readAccess, getEnvSignFields);
router.post('/envelope/remove-signature-field/:fieldId', removeDocSignField);
router.post('/envelope/connect/powerform', requireAuthenticatedEnvelopeAccess({ fromBody: true, requireSender: true }), connectPowerForm);
router.get('/envelope/signers/:envelopeId', readAccess, getSigners);
router.get('/envelope/all-stats/:userType', getAllEnvelopeStats);
router.post('/envelopes/bulk-fetch', fetchBulkEnvelopes);
router.post('/envelopes/exclude',getEnvelopesExcludingIds);
router.get('/cycles/:cycleId/download-completion',downloadCompletionZip)
// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications/:notificationId/read', markNotificationAsRead);
router.post('/notifications/read-all', markAllNotificationsAsRead);
// Recipients CRUD
router.get('/recipients', listRecipients);
router.post('/recipients', createRecipient);
router.put('/recipients/:id', updateRecipient);
router.delete('/recipients/:id', deleteRecipient);

module.exports = router;
