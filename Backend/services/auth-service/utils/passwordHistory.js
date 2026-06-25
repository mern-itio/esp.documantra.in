const bcrypt = require('bcrypt');

const PASSWORD_REUSE_MESSAGE =
  'You cannot reuse a recent password. Please choose a different password.';

const getPasswordHistoryLimit = () => {
  const parsed = Number(process.env.PASSWORD_HISTORY_COUNT || 5);
  if (!Number.isFinite(parsed) || parsed < 1) return 5;
  return Math.min(Math.floor(parsed), 24);
};

async function getPasswordReuseError(account, newPassword) {
  if (!newPassword) {
    return 'Password is required';
  }

  if (account?.password && (await bcrypt.compare(newPassword, account.password))) {
    return PASSWORD_REUSE_MESSAGE;
  }

  for (const entry of account?.passwordHistory || []) {
    if (entry?.hash && (await bcrypt.compare(newPassword, entry.hash))) {
      return PASSWORD_REUSE_MESSAGE;
    }
  }

  return null;
}

function archiveCurrentPassword(account) {
  if (!account?.password) return;

  const history = Array.isArray(account.passwordHistory)
    ? [...account.passwordHistory]
    : [];
  history.unshift({ hash: account.password, changedAt: new Date() });
  account.passwordHistory = history.slice(0, getPasswordHistoryLimit());
}

module.exports = {
  getPasswordReuseError,
  archiveCurrentPassword,
  PASSWORD_REUSE_MESSAGE,
};
