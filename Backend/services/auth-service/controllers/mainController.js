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
        { targetId: userId }
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
const markNotificationReadById = async (req, res) =>{
      try {
        const userId = req?.user?.data?.id;
        const { id } = req.params;
        console.log(id);
    
        if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
    
        const notification = await Notifications.findOne({
          _id: id.toString(),
          targetId: userId.toString()
        });
    
        if (!notification) {
          return res.status(404).json({ message: 'Notification not found' });
        }
    
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
    
        return res.status(200).json({
          status: 'success',
          message: 'Notification marked as read'
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
}
const markAllNotificationAsRead = async (req, res) =>{
  try{
    const userId = req?.user?.data?.id;
    if(!userId){
      return res.status(401).json({message:'Unauthorized'});
    }
    await Notifications.updateMany(
      {targetId:userId,isRead:false},
      {isRead:true,readAt:new Date()}
    );
    return res.status(200).json({
      status:'success',
      message:'All notifications marked as read'
    });
  }catch (err){
    console.log(err);
    return res.status(500).json({message: 'Server error', error:err.message});
  }
}
// Correct export
module.exports = { userDetails,findUserByEmail,insertNotifications,getNotifications,markNotificationReadById,markAllNotificationAsRead };
