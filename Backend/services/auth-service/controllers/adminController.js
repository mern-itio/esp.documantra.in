const User = require('../models/User');
// Admin Controller
const userList = async (req, res) => {
  try {
    // Fetch all users from the DB
    const users = await User.find().select('-password'); // Exclude password for security

    return res.status(200).json({
      status: 200,
      message: 'User list fetched successfully',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
};

// Export functions
module.exports = {
  userList
};
