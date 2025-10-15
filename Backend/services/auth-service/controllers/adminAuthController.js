const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/Admin');
const { isEmailValid } = require('@draftnsign/validators');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Auth Admin Login:", email);

    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!password) return res.status(400).json({ message: 'Password required' });
    if (!isEmailValid(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await AdminUser.findOne({ email }); 
    if (!admin) {
      return res.status(401).json({
        status: 401,     
        message: "Admin not found! Please check your Email Id",
        data: null                                                 
      });
    }
    console.log(bcrypt.hash(password, 10));

    if (admin.status === false) {
      return res.status(401).json({
        status: 401,
        message: "Your Admin Account has been suspended, please contact the System Owner",
        data: null
      });
    }

    const isPasswdCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswdCorrect) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials!!!",
        data: null
      });
    }

    const expireIn = process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h';
    const token = generateAdminAccessToken(admin, expireIn);

    const options = {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    };

    return res.cookie('adminAccessToken', token, options).status(200).json({
      status: 200,
      message: "Admin logged in successfully",
      admin_id: admin._id,
      token: token,
      type: 'admin'
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

function generateAdminAccessToken(admin, expireIn) {
  return jwt.sign(
    { id: admin._id, role: 'admin', email: admin.email },
    process.env.ADMIN_ACCESS_TOKEN_SECRET,
    { expiresIn: expireIn }
  );
}

module.exports = { adminLogin };
