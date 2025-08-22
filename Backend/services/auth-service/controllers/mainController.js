// controllers/MainController.js
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

// ✅ Correct export
module.exports = { userDetails };
