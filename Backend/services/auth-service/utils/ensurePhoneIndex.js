const User = require('../models/User');

function phoneDigitCount(phone) {
  return String(phone || '').replace(/\D/g, '').length;
}

/** Remove blank / country-code-only phones that collide on unique indexes. */
async function cleanupInvalidUserPhones() {
  const rows = await User.find({ phone: { $exists: true } }).select('_id phone').lean();
  const badIds = rows
    .filter((row) => phoneDigitCount(row.phone) < 10)
    .map((row) => row._id);

  if (!badIds.length) return 0;

  const result = await User.updateMany(
    { _id: { $in: badIds } },
    { $unset: { phone: 1 } }
  );
  const cleared = result.modifiedCount || 0;
  if (cleared) {
    console.log(`[auth] Cleared ${cleared} invalid/blank user phone value(s)`);
  }
  return cleared;
}

/**
 * Ensure phone uniqueness only applies to real numbers.
 * Legacy unique indexes on null/""/"91" block optional-phone signups.
 */
async function ensureUserPhoneIndex() {
  try {
    await cleanupInvalidUserPhones();

    const coll = User.collection;
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key || {});
      if (keys.length !== 1 || keys[0] !== 'phone') continue;
      // Keep only our partial unique index; drop older unique/sparse variants.
      if (idx.name === 'phone_unique_valid') continue;
      if (idx.unique || idx.sparse || idx.partialFilterExpression) {
        try {
          await coll.dropIndex(idx.name);
          console.log(`[auth] Dropped legacy phone index: ${idx.name}`);
        } catch (err) {
          console.warn(`[auth] Could not drop phone index ${idx.name}:`, err?.message);
        }
      }
    }

    await coll.createIndex(
      { phone: 1 },
      {
        unique: true,
        name: 'phone_unique_valid',
        partialFilterExpression: {
          phone: { $type: 'string', $gt: '' },
        },
      }
    );
    console.log('[auth] Ensured partial unique index phone_unique_valid');
  } catch (err) {
    console.warn('[auth] ensureUserPhoneIndex failed:', err?.message);
  }
}

module.exports = {
  cleanupInvalidUserPhones,
  ensureUserPhoneIndex,
  phoneDigitCount,
};
