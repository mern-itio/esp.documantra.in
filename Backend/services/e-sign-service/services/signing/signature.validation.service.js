const { fetchUserByEmail, fetchRecipientById, updateRecipient } = require('../recipientService');
const RecipientPermission = require('../../models/RecipientPermission');
const {
  extractAadhaarLast4,
  mergeSigningEvidence,
} = require('../../utils/signingEvidenceHelper');

async function persistAadhaarLast4(envelopeId, recipientId, aadhaarNumber) {
  const aadhaarLast4 = extractAadhaarLast4(aadhaarNumber);
  if (!envelopeId || !recipientId || !aadhaarLast4) return aadhaarLast4;

  try {
    const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
    if (permission) {
      permission.signingEvidence = mergeSigningEvidence(permission.signingEvidence || {}, {
        aadhaarLast4,
      });
      await permission.save();
    }
  } catch (err) {
    console.warn('[validate] aadhaarLast4 persist skipped:', err.message);
  }
  return aadhaarLast4;
}

module.exports = {
  aadhaarSignature: async (data) => {
    const { recipientId, envelopeId } = data;
    const recipient = await fetchRecipientById(recipientId);
    if (!recipient) {
      throw new Error(`Recipient not found for ID: ${recipientId}`);
    }

    if (recipient?.aadhaarNumber) {
      const aadhaarLast4 = await persistAadhaarLast4(
        envelopeId,
        recipientId,
        recipient.aadhaarNumber,
      );
      return {
        flag: true,
        method: 'aadhaarSignature',
        aadhaarLast4: aadhaarLast4 || extractAadhaarLast4(recipient.aadhaarNumber),
      };
    }

    if (!recipient?.authUserId) {
      return {
        flag: false,
        method: 'aadhaarSignature',
      };
    }

    const user = await fetchUserByEmail(recipient?.email);
    if (!user) return { flag: false, method: 'aadhaarSignature' };

    if (user.aadhaarNumber) {
      const updated = await updateRecipient(recipientId, {
        aadhaarNumber: user.aadhaarNumber,
      });
      const aadhaarLast4 = updated
        ? await persistAadhaarLast4(envelopeId, recipientId, user.aadhaarNumber)
        : extractAadhaarLast4(user.aadhaarNumber);
      return {
        flag: !!updated,
        method: 'aadhaarSignature',
        aadhaarLast4: aadhaarLast4 || null,
      };
    }

    return {
      flag: false,
      method: 'aadhaarSignature',
    };
  },
};
