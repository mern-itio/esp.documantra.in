// controllers/MainController.js
const Notifications = require('../models/Notifications');
const User = require('../models/User');

const userDetails = async (req, res) => {
    const userId = req.params.id || req.user.data.id; // Get user ID from params or token
    try {
        const UserDetails = await User.findById(userId);
        if (!UserDetails) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            status: 'success',
            data: UserDetails,
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const findUserByEmail = async (req, res) => {
    const rawEmail = req.params.email;
    const email = String(rawEmail || '').trim().toLowerCase();
    console.log(`Finding user by email: ${email}`);
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }
        // Case-insensitive exact match (safer if legacy rows have mixed casing)
        const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            status: 'success',
            data: user,
        });
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const insertNotifications = async (req, res) => {
    const userId = req.user.data.id;
    const {source, type, title, message,metadata, targetId} = req.body;
    try {
        const newNotification = await Notifications.create({
            createdBy:userId,
            targetId,
            source,
            type,
            title,
            message,
            metadata
        });
        return res.status(201).json({
            status: 'success',
            data: newNotification,
        });
    } catch (error) {
        console.error('Error inserting notification:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const getNotifications = async (req, res) => {
  const userId = req.user.data.id;
  const limit = Number(req.query.limit) || 20;

  try {
    const notifications = await Notifications.find({
      $or: [
        { targetId: userId },
        { createdBy: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: {
        notifications
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Correct export
module.exports = { userDetails,findUserByEmail,insertNotifications,getNotifications };
