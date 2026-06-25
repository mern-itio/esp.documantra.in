const getMaxConcurrentSessions = () => {
  const parsed = Number(process.env.MAX_CONCURRENT_SESSIONS || 5);
  if (!Number.isFinite(parsed) || parsed < 1) return 5;
  return Math.min(Math.floor(parsed), 20);
};

const getSessionActivityTime = (session) =>
  new Date(session?.lastActive || session?.createdAt || 0).getTime();

/**
 * Drop oldest active sessions when the user exceeds the concurrent session limit.
 */
function enforceConcurrentSessionLimit(user, { keepSessionId } = {}) {
  if (!user) return 0;

  const max = getMaxConcurrentSessions();
  let sessions = Array.isArray(user.activeSessions) ? [...user.activeSessions] : [];
  const initialCount = sessions.length;
  if (sessions.length <= max) {
    user.activeSessions = sessions;
    return 0;
  }

  while (sessions.length > max) {
    const sorted = sessions
      .map((session) => ({
        session,
        activity: getSessionActivityTime(session),
      }))
      .sort((a, b) => a.activity - b.activity);

    const victim =
      sorted.find(({ session }) => session.sessionId !== keepSessionId) || sorted[0];

    if (!victim) break;
    sessions = sessions.filter((session) => session.sessionId !== victim.session.sessionId);
  }

  user.activeSessions = sessions;
  return Math.max(initialCount - sessions.length, 0);
}

module.exports = {
  getMaxConcurrentSessions,
  enforceConcurrentSessionLimit,
};
