const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const { Upload, insertRecipient } = require('./eSignController');

async function resolvePublicSenderId(req) {
  const fromBody = (req.body?.senderEmail || '').trim().toLowerCase();
  if (fromBody) {
    try {
      const authBase = process.env.AUTH_URL || 'https://esp.documantra.in/auth';
      const response = await axios.get(
        `${authBase}/api/find-user/${encodeURIComponent(fromBody)}`
      );
      const userId = response.data?.data?._id || response.data?.data?.id;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        return String(userId);
      }
    } catch {
      /* fall through */
    }
  }

  const envSender = process.env.PUBLIC_FLOW_SENDER_ID;
  if (envSender && mongoose.Types.ObjectId.isValid(envSender)) {
    return String(envSender);
  }

  return null;
}

function issuePublicFlowToken(envelopeId, senderId) {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  return jwt.sign(
    {
      type: 'public-flow',
      envelopeId: String(envelopeId),
      senderId: String(senderId),
    },
    secret,
    { expiresIn: process.env.PUBLIC_FLOW_TOKEN_TTL || '7d' }
  );
}

const publicWizardUpload = async (req, res) => {
  const senderId = await resolvePublicSenderId(req);
  if (!senderId) {
    return res.status(503).json({
      message:
        'Public signing is not configured. Set PUBLIC_FLOW_SENDER_ID or sign in.',
    });
  }

  req.user = { data: { id: senderId } };
  return Upload(req, res);
};

const publicWizardAddRecipients = async (req, res) => {
  const senderId = await resolvePublicSenderId(req);
  if (!senderId) {
    return res.status(503).json({
      message:
        'Public signing is not configured. Set PUBLIC_FLOW_SENDER_ID or sign in.',
    });
  }

  req.user = { data: { id: senderId } };
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body?.envelopeId) {
        body.publicFlowToken = issuePublicFlowToken(body.envelopeId, senderId);
      }
    } catch (err) {
      console.error('Failed to issue public flow token:', err.message);
    }
    return originalJson(body);
  };

  return insertRecipient(req, res);
};

module.exports = {
  publicWizardUpload,
  publicWizardAddRecipients,
  issuePublicFlowToken,
  resolvePublicSenderId,
};
