const mongoose = require('mongoose');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');

// List recipients filtered by current user (UserId must match; null/other owners excluded)
exports.listRecipients = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const recipients = await Recipient.find({ UserId: userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ data: recipients });
  } catch (err) {
    console.error('listRecipients error', err);
    return res.status(500).json({ message: 'Failed to fetch recipients' });
  }
};

// Create recipient
exports.createRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { name, email, title = '', company = '', phone = '', address = '', signature = '' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await Recipient.findOne({ UserId: userId, email: normalizedEmail });
    if (existing) {
      const $set = {};
      if (name !== undefined && String(name).trim()) $set.name = String(name).trim();
      if (phone !== undefined && String(phone).trim()) $set.phone = String(phone).trim();
      // For optional profile fields, avoid wiping existing details with empty strings.
      if (title !== undefined && String(title).trim()) $set.title = String(title).trim();
      if (company !== undefined && String(company).trim()) $set.company = String(company).trim();
      if (address !== undefined && String(address).trim()) $set.address = String(address).trim();
      if (signature !== undefined && String(signature).trim()) $set.signature = String(signature).trim();

      const updated = Object.keys($set).length
        ? await Recipient.findOneAndUpdate(
          { _id: existing._id, UserId: userId },
          { $set },
          { new: true }
        )
        : existing;

      return res.status(200).json({ data: updated, updatedExisting: true });
    }

    const created = await Recipient.create({
      UserId: userId,
      name: String(name).trim(),
      email: normalizedEmail,
      title: String(title || '').trim(),
      company: String(company || '').trim(),
      phone: String(phone || '').trim(),
      address: String(address || '').trim(),
      signature: String(signature || '').trim()
    });
    return res.status(201).json({ data: created, updatedExisting: false });
  } catch (err) {
    console.error('createRecipient error', err);
    return res.status(500).json({ message: 'Failed to create recipient' });
  }
};

// Update recipient
exports.updateRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { name, email, title, company, phone, address, signature } = req.body;

    const $set = {};
    if (name !== undefined) $set.name = name;
    if (email !== undefined) $set.email = email;
    if (title !== undefined) $set.title = title;
    if (company !== undefined) $set.company = company;
    if (phone !== undefined) $set.phone = phone;
    if (address !== undefined) $set.address = address;
    if (signature !== undefined) $set.signature = signature;

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipient id' });
    }

    const updated = await Recipient.findOneAndUpdate(
      { _id: id, UserId: userId },
      { $set },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('updateRecipient error', err);
    return res.status(500).json({ message: 'Failed to update recipient' });
  }
};

// Delete recipient
exports.deleteRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipient id' });
    }

    const deleted = await Recipient.findOneAndDelete({ _id: id, UserId: userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    return res.status(200).json({ message: 'Recipient deleted' });
  } catch (err) {
    console.error('deleteRecipient error', err);
    return res.status(500).json({ message: 'Failed to delete recipient' });
  }
};
exports.updateAuthStatus = async (req, res) => {
  try {
    const {
      recipientId,
      providerId,
      verificationStatus,
      envelopeId,
      biometricEvidence,
      authMethodName,
      authMethodType,
    } = req.body;

    if (!recipientId || !providerId || !verificationStatus || !envelopeId) {
      return res.status(400).json({
        message: 'recipientId, providerId, verificationStatus, and envelopeId are required'
      });
    }

    const updatedRecord = await RecipientPermission.findOneAndUpdate(
      {
        recipientId,
        envelopeId,
        "authLevel.authMethodId": providerId
      },
      {
        $set: {
          "authLevel.$.status": verificationStatus
        }
      },
      {
        new: true
      }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        message: 'Recipient auth method not found'
      });
    }

    if (verificationStatus === 'completed' && biometricEvidence) {
      const { mergeSigningEvidence } = require('../utils/signingEvidenceHelper');
      const merged = mergeSigningEvidence(updatedRecord.signingEvidence || {}, {
        ...biometricEvidence,
        authMethods: [
          {
            authMethodId: String(providerId),
            name: authMethodName || biometricEvidence.authMethodName || 'Authentication',
            type: authMethodType || biometricEvidence.authMethodType || 'auth',
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        ],
      });
      updatedRecord.signingEvidence = merged;
      await updatedRecord.save();
    }

    return res.status(200).json({
      message: 'Authentication status updated successfully',
      signingEvidence: updatedRecord.signingEvidence || null,
    });

  } catch (err) {
    console.error('updateAuthStatus error', err);
    return res.status(500).json({
      message: 'Failed to update authentication status'
    });
  }
};

exports.patchSigningEvidence = async (req, res) => {
  try {
    const { recipientId, envelopeId, evidence } = req.body;
    if (!recipientId || !envelopeId || !evidence) {
      return res.status(400).json({ message: 'recipientId, envelopeId, and evidence are required' });
    }

    const permission = await RecipientPermission.findOne({ recipientId, envelopeId });
    if (!permission) {
      return res.status(404).json({ message: 'Recipient permission not found' });
    }

    const { mergeSigningEvidence } = require('../utils/signingEvidenceHelper');
    permission.signingEvidence = mergeSigningEvidence(permission.signingEvidence || {}, evidence);
    await permission.save();

    return res.status(200).json({
      message: 'Signing evidence updated',
      signingEvidence: permission.signingEvidence,
    });
  } catch (err) {
    console.error('patchSigningEvidence error', err);
    return res.status(500).json({ message: 'Failed to update signing evidence' });
  }
};
exports.saveAadhaar = async (req, res) => {
  try {
    const { currentUserId, aadhaarNumber } = req.body;
    const envelopeID = req.body.envelopeID || req.body.envelopeId;
    if (!currentUserId || !aadhaarNumber) {
      return res.status(400).json({ message: 'currentUserId and aadhaarNumber are required' });
    }
    const updated = await Recipient.findByIdAndUpdate(
      currentUserId,
      { aadhaarNumber },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const aadhaarLast4 = String(aadhaarNumber || '').replace(/\D/g, '').slice(-4);
    if (envelopeID && aadhaarLast4) {
      const mongoose = require('mongoose');
      const RecipientPermission = require('../models/RecipientPermission');
      const { mergeSigningEvidence } = require('../utils/signingEvidenceHelper');
      const envelopeQuery = mongoose.Types.ObjectId.isValid(envelopeID)
        ? { $in: [envelopeID, new mongoose.Types.ObjectId(envelopeID)] }
        : envelopeID;
      const recipientQuery = mongoose.Types.ObjectId.isValid(currentUserId)
        ? { $in: [currentUserId, new mongoose.Types.ObjectId(currentUserId)] }
        : currentUserId;
      const permission = await RecipientPermission.findOne({
        envelopeId: envelopeQuery,
        recipientId: recipientQuery,
      });
      if (permission) {
        permission.signingEvidence = mergeSigningEvidence(permission.signingEvidence || {}, {
          aadhaarLast4,
        });
        await permission.save();
      }
    }

    return res.status(200).json({
      data: updated,
      aadhaarLast4: aadhaarLast4 || null,
    });
  } catch (err) {
    console.error('saveAadhaar error', err);
    return res.status(500).json({ message: 'Failed to save Aadhaar number' });
  }
};
