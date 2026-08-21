const ESignApiKey = require('../models/apiKey');

/** Update last-used timestamp whenever the sandbox key is used. */
async function touchSandboxKeyLastUsed(keyDoc) {
  if (!keyDoc?._id) return;
  await ESignApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } });
}

/** Increment monthly sandbox quota usage (envelope sent or signature applied). */
async function incrementSandboxKeyUsage(keyDoc, { fieldId } = {}) {
  if (!keyDoc?._id) return null;

  const doc = await ESignApiKey.findById(keyDoc._id);
  if (!doc) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  doc.usageCount = (doc.usageCount || 0) + 1;
  doc.lastUsedAt = now;

  let logUpdated = false;
  doc.usageLogs = (doc.usageLogs || []).map((log) => {
    if (log.year === year && log.month === month) {
      log.count = (log.count || 0) + 1;
      logUpdated = true;
    }
    return log;
  });
  if (!logUpdated) {
    doc.usageLogs.push({ year, month, count: 1 });
  }

  if (fieldId) {
    doc.fieldIds = doc.fieldIds || [];
    if (!doc.fieldIds.includes(fieldId)) {
      doc.fieldIds.push(fieldId);
      if (doc.fieldIds.length > 10) {
        doc.fieldIds = doc.fieldIds.slice(-10);
      }
    }
  }

  await doc.save();
  return doc;
}

module.exports = { touchSandboxKeyLastUsed, incrementSandboxKeyUsage };
