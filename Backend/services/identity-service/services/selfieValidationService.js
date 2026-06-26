const sharp = require('sharp');

const pixelVariance = (data) => {
  if (!data?.length) return 0;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = data[i];
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / data.length;
  return sumSq / data.length - mean * mean;
};

const normalizeFaceBox = (faceBox) => {
  if (!faceBox || typeof faceBox !== 'object') return null;
  const x = Number(faceBox.x);
  const y = Number(faceBox.y);
  const width = Number(faceBox.width);
  const height = Number(faceBox.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return { x, y, width, height };
};

const validateImageQuality = async (buffer) => {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    return { ok: false, message: 'Invalid image. Please capture again.' };
  }
  if (meta.width < 320 || meta.height < 320) {
    return { ok: false, message: 'Image resolution is too low. Move closer to the camera.' };
  }

  const stats = await sharp(buffer).stats();
  const brightness =
    stats.channels.reduce((acc, ch) => acc + (ch.mean || 0), 0) / Math.max(stats.channels.length, 1);

  if (brightness < 45) {
    return { ok: false, message: 'Image is too dark. Use better lighting and retry.' };
  }
  if (brightness > 225) {
    return { ok: false, message: 'Image is overexposed. Reduce glare and retry.' };
  }

  const { data } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
  const variance = pixelVariance(data);
  if (variance < 350) {
    return { ok: false, message: 'Image is too blurry. Hold the device steady and retry.' };
  }

  return { ok: true, width: meta.width, height: meta.height, brightness, variance };
};

const validateFaceBox = (faceBox, { strictCenter = true } = {}) => {
  const box = normalizeFaceBox(faceBox);
  if (!box) {
    return { ok: false, message: 'No face detected. Center your face in the frame.' };
  }

  if (box.width < 0.14 || box.height < 0.14) {
    return { ok: false, message: 'Face is too small. Move closer to the camera.' };
  }
  if (box.width > 0.78 || box.height > 0.9) {
    return { ok: false, message: 'Face is too close. Move slightly back.' };
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  if (strictCenter && (centerX < 0.28 || centerX > 0.72 || centerY < 0.22 || centerY > 0.78)) {
    return { ok: false, message: 'Center your face in the guide and capture again.' };
  }

  return { ok: true, box };
};

exports.validateSelfieCapture = async (buffer, faceBox) => {
  const quality = await validateImageQuality(buffer);
  if (!quality.ok) return quality;

  const face = validateFaceBox(faceBox, { strictCenter: true });
  if (!face.ok) return face;

  return {
    ok: true,
    checks: {
      brightness: quality.brightness,
      variance: quality.variance,
      faceBox: face.box,
    },
  };
};

exports.validateLivenessCapture = async (primaryBuffer, secondaryBuffer, primaryFaceBox, secondaryFaceBox) => {
  const firstQuality = await validateImageQuality(primaryBuffer);
  if (!firstQuality.ok) return { ok: false, message: `Step 1 failed: ${firstQuality.message}` };

  const secondQuality = await validateImageQuality(secondaryBuffer);
  if (!secondQuality.ok) return { ok: false, message: `Step 2 failed: ${secondQuality.message}` };

  const firstFace = validateFaceBox(primaryFaceBox, { strictCenter: true });
  if (!firstFace.ok) return { ok: false, message: `Step 1 failed: ${firstFace.message}` };

  const secondFace = validateFaceBox(secondaryFaceBox, { strictCenter: false });
  if (!secondFace.ok) return { ok: false, message: `Step 2 failed: ${secondFace.message}` };

  const c1x = firstFace.box.x + firstFace.box.width / 2;
  const c2x = secondFace.box.x + secondFace.box.width / 2;
  const movement = Math.abs(c2x - c1x);

  if (movement < 0.035) {
    return {
      ok: false,
      message: 'Liveness check failed. Turn your head slightly left, then capture again.',
    };
  }
  if (movement > 0.32) {
    return {
      ok: false,
      message: 'Liveness check failed. Turn only slightly, not too far.',
    };
  }

  return {
    ok: true,
    checks: {
      movement,
      primaryFaceBox: firstFace.box,
      secondaryFaceBox: secondFace.box,
    },
  };
};
