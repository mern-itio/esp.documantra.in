const { serviceGet } = require('../utils/apiHelper');

const userList = async (req, res) => {
  try {
    const result = await serviceGet(req, 'auth', { url: '/api-admin/user-list' });
    if (!result.ok) {
      return res.status(result.status).json({ status: result.status, message: result.message, data: null });
    }
    return res.status(200).json({
      status: 200,
      message: 'User list fetched successfully from auth-service',
      data: result.data?.data ?? result.data
    });
  } catch (error) {
    console.error('Error fetching user list from auth-service:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

module.exports = { userList };
