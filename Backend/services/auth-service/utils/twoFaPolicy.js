const isLoginTwoFaEnforcementEnabled = () =>
  String(process.env.REQUIRE_2FA_FOR_LOGIN || '').toLowerCase() === 'true';

const isEsignTwoFaEnforcementEnabled = () =>
  String(process.env.REQUIRE_2FA_FOR_E_SIGN || '').toLowerCase() === 'true';

const getTwoFaGraceDays = () => {
  const parsed = Number(process.env.REQUIRE_2FA_GRACE_DAYS || 14);
  if (!Number.isFinite(parsed) || parsed < 0) return 14;
  return Math.min(Math.floor(parsed), 365);
};

function shouldRequireTwoFaSetup(user) {
  if (!isLoginTwoFaEnforcementEnabled()) return false;
  if (!user || user.twoFaEnabled) return false;

  const graceDays = getTwoFaGraceDays();
  if (graceDays > 0 && user.createdAt) {
    const graceMs = graceDays * 24 * 60 * 60 * 1000;
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    if (accountAgeMs < graceMs) return false;
  }

  return true;
}

const isAdminLoginTwoFaEnforcementEnabled = () =>
  String(process.env.REQUIRE_2FA_FOR_ADMIN_LOGIN || '').toLowerCase() === 'true';

const getAdminTwoFaGraceDays = () => {
  const parsed = Number(process.env.REQUIRE_2FA_ADMIN_GRACE_DAYS ?? process.env.REQUIRE_2FA_GRACE_DAYS ?? 90);
  if (!Number.isFinite(parsed) || parsed < 0) return 90;
  return Math.min(Math.floor(parsed), 365);
};

function shouldRequireAdminTwoFaSetup(admin) {
  if (!isAdminLoginTwoFaEnforcementEnabled()) return false;
  if (!admin || admin.twoFaEnabled) return false;

  const graceDays = getAdminTwoFaGraceDays();
  if (graceDays > 0 && admin.createdAt) {
    const graceMs = graceDays * 24 * 60 * 60 * 1000;
    const accountAgeMs = Date.now() - new Date(admin.createdAt).getTime();
    if (accountAgeMs < graceMs) return false;
  }

  return true;
}

module.exports = {
  isLoginTwoFaEnforcementEnabled,
  isEsignTwoFaEnforcementEnabled,
  getTwoFaGraceDays,
  shouldRequireTwoFaSetup,
  isAdminLoginTwoFaEnforcementEnabled,
  getAdminTwoFaGraceDays,
  shouldRequireAdminTwoFaSetup,
};
