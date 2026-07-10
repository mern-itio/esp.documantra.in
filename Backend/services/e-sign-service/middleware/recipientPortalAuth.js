const { verifyRecipientPortalToken } = require('../helpers/recipientPortalToken');

function recipientPortalAuth(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : String(req.headers['x-recipient-portal-token'] || '').trim();

    if (!token) {
      return res.status(401).json({ message: 'Recipient portal session required' });
    }

    const session = verifyRecipientPortalToken(token);
    req.recipientPortal = session;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Recipient portal session expired or invalid' });
  }
}

module.exports = recipientPortalAuth;
