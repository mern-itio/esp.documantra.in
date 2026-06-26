const fs = require('fs');
const path = require('path');
const SelfieVerification = require('../models/selfieVerification');
const {
  validateSelfieCapture,
  validateLivenessCapture,
} = require('../services/selfieValidationService');

const SELFIE_DIR = path.join(__dirname, '..', 'uploads', 'selfies');

const ensureSelfieDir = () => {
  if (!fs.existsSync(SELFIE_DIR)) {
    fs.mkdirSync(SELFIE_DIR, { recursive: true });
  }
};

const parseBase64Image = (imageBase64) => {
  const raw = String(imageBase64 || '').trim();
  if (!raw) return null;

  const match = raw.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (match) {
    return {
      ext: match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase(),
      buffer: Buffer.from(match[2], 'base64'),
    };
  }

  return {
    ext: 'jpg',
    buffer: Buffer.from(raw, 'base64'),
  };
};

const saveImage = (verificationId, label, parsed) => {
  const fileName = `${verificationId}-${label}-${Date.now()}.${parsed.ext}`;
  const absolutePath = path.join(SELFIE_DIR, fileName);
  fs.writeFileSync(absolutePath, parsed.buffer);
  return path.posix.join('selfies', fileName);
};

exports.storeSelfie = async (req, res) => {
  try {
    const { userId, envelopeId, authProviderId, verificationId, imageBase64, faceBox } = req.body || {};

    if (!userId || !authProviderId || !verificationId || !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'userId, authProviderId, verificationId, and imageBase64 are required',
      });
    }

    const parsed = parseBase64Image(imageBase64);
    if (!parsed?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'Invalid selfie image data' });
    }

    if (parsed.buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Selfie image is too large (max 8MB)' });
    }

    const validation = await validateSelfieCapture(parsed.buffer, faceBox);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        validationFailed: true,
      });
    }

    ensureSelfieDir();
    const relativePath = saveImage(verificationId, 'selfie', parsed);

    const record = await SelfieVerification.findOneAndUpdate(
      { verificationId },
      {
        userId: String(userId),
        envelopeId: envelopeId ? String(envelopeId) : null,
        authProviderId: String(authProviderId),
        verificationId: String(verificationId),
        imagePath: relativePath,
        status: 'completed',
        metadata: {
          mode: 'selfie_capture',
          checks: validation.checks,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Selfie verified successfully',
      data: {
        id: record._id,
        imagePath: record.imagePath,
        imageUrl: `/uploads/${record.imagePath}`,
      },
    });
  } catch (err) {
    console.error('storeSelfie error:', err);
    return res.status(500).json({ success: false, message: 'Failed to validate selfie' });
  }
};

exports.storeLiveness = async (req, res) => {
  try {
    const {
      userId,
      envelopeId,
      authProviderId,
      verificationId,
      imageBase64,
      secondaryImageBase64,
      faceBox,
      secondaryFaceBox,
    } = req.body || {};

    if (!userId || !authProviderId || !verificationId || !imageBase64 || !secondaryImageBase64) {
      return res.status(400).json({
        success: false,
        message: 'userId, authProviderId, verificationId, imageBase64, and secondaryImageBase64 are required',
      });
    }

    const primary = parseBase64Image(imageBase64);
    const secondary = parseBase64Image(secondaryImageBase64);
    if (!primary?.buffer?.length || !secondary?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'Invalid liveness image data' });
    }

    const validation = await validateLivenessCapture(
      primary.buffer,
      secondary.buffer,
      faceBox,
      secondaryFaceBox
    );
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        validationFailed: true,
      });
    }

    ensureSelfieDir();
    const primaryPath = saveImage(verificationId, 'liveness-primary', primary);
    const secondaryPath = saveImage(verificationId, 'liveness-secondary', secondary);

    const record = await SelfieVerification.findOneAndUpdate(
      { verificationId },
      {
        userId: String(userId),
        envelopeId: envelopeId ? String(envelopeId) : null,
        authProviderId: String(authProviderId),
        verificationId: String(verificationId),
        imagePath: primaryPath,
        status: 'completed',
        metadata: {
          mode: 'liveness_check',
          secondaryImagePath: secondaryPath,
          checks: validation.checks,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Liveness verified successfully',
      data: {
        id: record._id,
        imagePath: record.imagePath,
        secondaryImagePath: secondaryPath,
      },
    });
  } catch (err) {
    console.error('storeLiveness error:', err);
    return res.status(500).json({ success: false, message: 'Failed to validate liveness' });
  }
};

exports.getSelfieStatus = async (req, res) => {
  try {
    const { verificationId } = req.params;
    if (!verificationId) {
      return res.status(400).json({ success: false, message: 'verificationId is required' });
    }

    const record = await SelfieVerification.findOne({ verificationId }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Selfie verification not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: record.status,
        imageUrl: record.imagePath ? `/uploads/${record.imagePath}` : null,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    console.error('getSelfieStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch selfie status' });
  }
};
