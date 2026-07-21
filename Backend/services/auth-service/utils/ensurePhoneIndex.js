const User = require('../models/User');

const PHONE_INDEX_NAME = 'phone_unique_valid';

function phoneDigitCount(phone) {
  return String(phone || '').replace(/\D/g, '').length;
}

/** Remove blank / country-code-only / null phones that collide on unique indexes. */
async function cleanupInvalidUserPhones() {
  const coll = User.collection;

  // Unset null / empty string phones first (legacy unique indexes treat these as duplicates).
  const unsetNull = await coll.updateMany(
    { $or: [{ phone: null }, { phone: '' }] },
    { $unset: { phone: 1 } }
  );

  const rows = await User.find({ phone: { $exists: true, $type: 'string' } })
    .select('_id phone')
    .lean();
  const badIds = rows
    .filter((row) => phoneDigitCount(row.phone) < 10)
    .map((row) => row._id);

  let clearedShort = 0;
  if (badIds.length) {
    const result = await User.updateMany(
      { _id: { $in: badIds } },
      { $unset: { phone: 1 } }
    );
    clearedShort = result.modifiedCount || 0;
  }

  const cleared = (unsetNull.modifiedCount || 0) + clearedShort;
  if (cleared) {
    console.log(`[auth] Cleared ${cleared} invalid/blank/null user phone value(s)`);
  }
  return cleared;
}

/** Drop every index whose key is only `phone`. */
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

/**
 * Ensure phone uniqueness only applies to real 10–15 digit numbers.
 * Legacy unique indexes on null/""/"91" block optional-phone signups.
 */
async function ensureUserPhoneIndex() {
  try {
    await cleanupInvalidUserPhones();
    await dropAllPhoneIndexes();

    await User.collection.createIndex(
      { phone: 1 },
      {
        unique: true,
        name: PHONE_INDEX_NAME,
        // Only index real numbers — missing/null/blank/"91" must NOT be unique-checked.
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

/** Cleanup + rebuild phone index, then caller can retry User.create. */
async function repairPhoneUniqueness() {
  await cleanupInvalidUserPhones();
  return ensureUserPhoneIndex();
}

module.exports = {
  cleanupInvalidUserPhones,
  ensureUserPhoneIndex,
  repairPhoneUniqueness,
  phoneDigitCount,
  PHONE_INDEX_NAME,
};
