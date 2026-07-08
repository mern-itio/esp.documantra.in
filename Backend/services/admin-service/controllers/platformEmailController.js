const { serviceGet, servicePut, servicePost } = require('../utils/apiHelper');

const getPlatformEmailConfig = async (req, res) => {
  const result = await serviceGet(req, 'email', { url: '/admin/platform-email' });
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json(result.data);
};

const updatePlatformEmailConfig = async (req, res) => {
  const result = await servicePut(req, 'email', {
    url: '/admin/platform-email',
    data: req.body,
  });
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json(result.data);
};

const testPlatformEmail = async (req, res) => {
  const result = await servicePost(req, 'email', {
    url: '/admin/platform-email/test',
    data: req.body,
  });
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json(result.data);
};

module.exports = {
  getPlatformEmailConfig,
  updatePlatformEmailConfig,
  testPlatformEmail,
};
