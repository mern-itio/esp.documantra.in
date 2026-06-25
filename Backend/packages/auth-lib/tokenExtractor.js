const getCookieValue = (req, name) => {
  const header = req.headers?.cookie;
  if (!header || typeof header !== 'string') return null;

  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
};

const extractAccessToken = (req, type = 'user') => {
  const authHeader = req.headers?.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (bearer) return bearer;

  const cookieName = type === 'admin' ? 'adminAccessToken' : 'accessToken';
  return getCookieValue(req, cookieName);
};

module.exports = {
  extractAccessToken,
  getCookieValue,
};
