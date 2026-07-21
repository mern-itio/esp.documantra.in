const mongoose = require('mongoose');
const User = require('../models/User');

const PHONE_INDEX_NAME = 'phone_unique_valid';
const OPTIONAL_PHONE_PREFIX = '__opt_';

function isPlaceholderPhone(phone) {
  return String(phone || '').startsWith(OPTIONAL_PHONE_PREFIX);
}

/** Unique stand-in so optional-phone signups never collide on legacy unique(null) indexes. */
function makeOptionalPhonePlaceholder(userId) {
  const id = userId ? String(userId) : new mongoose.Types.ObjectId().toString();
  return `${OPTIONAL_PHONE_PREFIX}${id}`;
}

function phoneDigitCount(phone) {
  if (isPlaceholderPhone(phone)) return 0;
  return String(phone || '').replace(/\D/g, '').length;
}

function publicPhoneValue(phone) {
  if (!phone || isPlaceholderPhone(phone)) return '';
  return String(phone);
}

/** Normalize blank/null/short phones to unique placeholders (never leave null/"" ). */
async function cleanupInvalidUserPhones() {
  const rows = await User.find({
    $or: [
      { phone: null },
      { phone: '' },
      { phone: { $exists: true } },
    ],
  })
    .select('_id phone')
    .lean();

  let fixed = 0;
  for (const row of rows) {
    if (isPlaceholderPhone(row.phone)) continue;
    if (row.phone && phoneDigitCount(row.phone) >= 10) continue;
    await User.updateOne(
      { _id: row._id },
      { $set: { phone: makeOptionalPhonePlaceholder(row._id) } }
    );
    fixed += 1;
  }

  if (fixed) {
    console.log(`[auth] Normalized ${fixed} invalid/blank/null user phone value(s) to unique placeholders`);
  }
  return fixed;
}

async function dropAllPhoneIndexes() {
  const coll = User.collection;
  const indexes = await coll.indexes();
  let dropped = 0;
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    if (keys.length !== 1 || keys[0] !== 'phone') continue;
    if (idx.name === '_id_') continue;
    try {
      await coll.dropIndex(idx.name);
      dropped += 1;
      console.log(`[auth] Dropped phone index: ${idx.name}`);
    } catch (err) {
      console.warn(`[auth] Could not drop phone index ${idx.name}:`, err?.message);
    }
  }
  return dropped;
}

async function ensureUserPhoneIndex() {
  try {
    await cleanupInvalidUserPhones();
    await dropAllPhoneIndexes();

    await User.collection.createIndex(
      { phone: 1 },
      {
        unique: true,
        name: PHONE_INDEX_NAME,
        partialFilterExpression: {
          phone: { $type: 'string', $regex: /^\d{10,15}$/ },
        },
      }
    );
    console.log(`[auth] Ensured partial unique index ${PHONE_INDEX_NAME}`);
    return true;
  } catch (err) {
    console.warn('[auth] ensureUserPhoneIndex failed:', err?.message);
    return false;
  }
}

async function repairPhoneUniqueness() {
  await cleanupInvalidUserPhones();
  return ensureUserPhoneIndex();
}

module.exports = {
  cleanupInvalidUserPhones,
  ensureUserPhoneIndex,
  repairPhoneUniqueness,
  phoneDigitCount,
  isPlaceholderPhone,
  makeOptionalPhonePlaceholder,
  publicPhoneValue,
  OPTIONAL_PHONE_PREFIX,
  PHONE_INDEX_NAME,
};
