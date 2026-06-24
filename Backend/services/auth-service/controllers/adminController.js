const User = require('../models/User');
const bcrypt = require('bcrypt');
const { getPasswordPolicyError } = require('@draftnsign/validators');
// Admin Controller
const userList = async (req, res) => {
  try {
    // Fetch all users from the DB
    const users = await User.find().select('-password') // Exclude password for security
                  .sort({ createdAt: -1 }); // -1 for descending order
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

const userDetail = async(req, res) => {
  const {id} = req.params
  try{
    const user = await User.findById({_id: id});
    return res.status(200).json({
      status:200,
      message:'User details fetched successfully',
      data:user
    })
  }catch (err){
    console.error('Error fetching users:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
}

const userStatusToggle = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Find the user by ID and update the status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },           // set new status
      { new: true, select: '-password' } // return updated document, exclude password
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'User status updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
};

const updateUserDetail = async (req, res) => {
  const {id} = req.params;
  const {data} = req.body;
    try{ 
        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true, runValidators: true }
          ).select('-password'); // exclude password field
          if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
          }
          return res.status(200).json({
            status: 200,
            message: 'User details updated successfully',
            data: updatedUser
          });
        }catch (err){
          console.error('Error updating user:', err);
          return res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
            data: null
          });
        }
};

const updateUserPassword = async (req, res) =>{
  const {id} = req.params;
  const {password} = req.body;
  if (!id || !password) {
    return res.status(400).json({ status: 400, message: 'User ID and password are required', data: null });
  }

  const passwordError = getPasswordPolicyError(password);
  if (passwordError) {
    return res.status(400).json({ status: 400, message: passwordError, data: null });
  }

  try{
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found', data: null });
    }

    user.password = password;
    user.activeSessions = [];
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const safeUser = await User.findById(id).select('-password');
    return res.status(200).json({ status: 200, message: 'Password updated successfully', data: safeUser });

  }catch (err){
    console.error('Error updating user:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
}


// Export functions
module.exports = {
  userList,
  userStatusToggle,
  userDetail,
  updateUserDetail,
  updateUserPassword
};
