const { serviceGet, servicePut, servicePost } = require('../utils/apiHelper');

const getVSignConfig = async (req, res) => {
  const result = await serviceGet(req, 'esign', { url: '/admin/vsign-config' });
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json(result.data);
};

const updateVSignConfig = async (req, res) => {
  const result = await servicePut(req, 'esign', {
    url: '/admin/vsign-config',
    data: req.body,
  });
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json(result.data);
};

const testVSignConfig = async (req, res) => {
  const result = await servicePost(req, 'esign', {
    url: '/admin/vsign-config/test',
    data: req.body,
  });
  if (!result.ok) {
    return res.status(result.status).json(result.data || { message: result.message });
  }
  return res.status(200).json(result.data);
};

module.exports = {
  getVSignConfig,
  updateVSignConfig,
  testVSignConfig,
};
