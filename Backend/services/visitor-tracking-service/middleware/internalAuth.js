function requireInternalSecret(req, res, next) {
  const expected = process.env.TRACKING_INTERNAL_SECRET || '';
  const got = req.headers['x-tracking-secret'] || '';
  if (!expected || got !== expected) {
    return res.status(401).json({ status: 401, message: 'Unauthorized' });
  }
  return next();
}

module.exports = { requireInternalSecret };
