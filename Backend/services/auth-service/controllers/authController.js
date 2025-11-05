const jwt = require('jsonwebtoken');
const User  = require('../models/User');
const { isEmailValid } = require('@draftnsign/validators');
// const { verifyJWT } = require('@draftnsign/auth-lib');
const bcrypt = require('bcrypt');
// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ message: 'Email required' });
  if (!password) return res.status(400).json({ message: 'Password required' });
  if (!isEmailValid(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      status: 401,
      message: "User is not exists with Us! Please check your Email Id",
      data: null
    });
  }

  if (user?.status === false) {
    return res.status(401).json({
      status: 401,
      message: "Your Account has been suspended, please contact the Admin",
      data: null
    });
  }

  const isPasswdCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswdCorrect) {
    return res.status(401).json({
      status: 401,
      message: "Invalid Credentials!!!",
      data: null
    });
  }

  // If first login, set isFirstLogin to false after login
  let isFirstLogin = user.isFirstLogin;
  if (user.isFirstLogin) {
    user.isFirstLogin = false;
    await user.save();
  }

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '12h';
  const generateToken = await generateAccessTokenUser(user, expireIn);
  const options = {
    httpOnly: true,
    expiresIn: expireIn
  };

  return res.cookie('accessToken', generateToken, options).status(200).json({
    status: 201,
    message: "User is logged in successfully",
    user_id: user._id,
    token: generateToken,
    type: 'user',
    plan: user.plan || 'free',
    isFirstLogin: isFirstLogin
  });
};

// Register Controller
const register = async (req, res) => {
  const { fullname, email, phone, password } = req.body;

  if (!fullname || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isEmailValid(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Default plan is free on first registration
    const user = await User.create({ fullname, email, phone, password, plan: 'free' });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Email or phone already exists');
      return res.status(400).json({ message: 'Email or phone already exists' });
    }
    console.error('Server error', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Access Token Generator
async function generateAccessTokenUser(user, expireIn) {
  const dataSend = {
    id: user._id,
    email: user.email,
    fullname: user.fullname,
    type: 'user'
  };

  try {
    return jwt.sign(
      {
        expiresIn: expireIn,
        exp: Math.floor(Date.now() / 1000) + 43200,
        data: dataSend
      },
      process.env.ACCESS_TOKEN_SECRET
    );
  } catch (error) {
    console.log("Error while generating Access Token", error);
  }
}

// Get current user details
const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 401,
        message: "User not authenticated",
        data: null
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User details retrieved successfully",
      data: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        plan: user.plan || 'free',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null
    });
  }
};

// Export functions
module.exports = {
  login,
  register,
  getMe
};
