const axios = require('axios');

const userList = async (req, res) => {
  try {
    // Get the token from incoming request
    const authHeader = req.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: 'Missing token',
        data: null
      });
    }

    // Call the auth-service endpoint
    const response = await axios.get('http://localhost:2101/api-admin/user-list', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from auth-service
    return res.status(200).json({
      status: 200,
      message: 'User list fetched successfully from auth-service',
      data: response.data.data
    });
  } catch (error) {
    console.error('Error fetching user list from auth-service:', error.message);
    return res.status(error.response?.status || 500).json({
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Internal Server Error',
      data: null
    });
  }
};

module.exports = { userList };
