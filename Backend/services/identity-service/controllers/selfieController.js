const fs = require('fs');
const path = require('path');
const SelfieVerification = require('../models/selfieVerification');

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

exports.storeSelfie = async (req, res) => {
  try {
    const { userId, envelopeId, authProviderId, verificationId, imageBase64 } = req.body || {};

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

    ensureSelfieDir();

    const fileName = `${verificationId}-${Date.now()}.${parsed.ext}`;
    const absolutePath = path.join(SELFIE_DIR, fileName);
    fs.writeFileSync(absolutePath, parsed.buffer);

    const relativePath = path.posix.join('selfies', fileName);

    const record = await SelfieVerification.findOneAndUpdate(
      { verificationId },
      {
        userId: String(userId),
        envelopeId: envelopeId ? String(envelopeId) : null,
        authProviderId: String(authProviderId),
        verificationId: String(verificationId),
        imagePath: relativePath,
        status: 'completed',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Selfie stored successfully',
      data: {
        id: record._id,
        imagePath: record.imagePath,
        imageUrl: `/uploads/${record.imagePath}`,
      },
    });
  } catch (err) {
    console.error('storeSelfie error:', err);
    return res.status(500).json({ success: false, message: 'Failed to store selfie' });
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
