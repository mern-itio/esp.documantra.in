const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
// List recipients filtered by current user
exports.listRecipients = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const recipients = await Recipient.find({ UserId: userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: recipients });
  } catch (err) {
    console.error('listRecipients error', err);
    return res.status(500).json({ message: 'Failed to fetch recipients' });
  }
};

// Create recipient
exports.createRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { name, email, title = '', company = '', phone = '', address = '', signature = '' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const created = await Recipient.create({ 
      UserId: userId,
      name, 
      email, 
      title, 
      company, 
      phone, 
      address, 
      signature 
    });
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error('createRecipient error', err);
    return res.status(500).json({ message: 'Failed to create recipient' });
  }
};

// Update recipient
exports.updateRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { name, email, title, company, phone, address, signature } = req.body;
    
    // First check if recipient exists and belongs to the user
    const recipient = await Recipient.findById(id);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (recipient.UserId && recipient.UserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this recipient' });
    }
    
    const updated = await Recipient.findByIdAndUpdate(
      id,
      { $set: { name, email, title, company, phone, address, signature } },
      { new: true }
    );
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('updateRecipient error', err);
    return res.status(500).json({ message: 'Failed to update recipient' });
  }
};

// Delete recipient
exports.deleteRecipient = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    
    // First check if recipient exists and belongs to the user
    const recipient = await Recipient.findById(id);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (recipient.UserId && recipient.UserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this recipient' });
    }
    
    const deleted = await Recipient.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Recipient deleted' });
  } catch (err) {
    console.error('deleteRecipient error', err);
    return res.status(500).json({ message: 'Failed to delete recipient' });
  }
};
exports.updateAuthStatus = async (req, res) => {
  try {
    const { recipientId, providerId, verificationStatus, envelopeId } = req.body;

    if (!recipientId || !providerId || !verificationStatus || !envelopeId) {
      return res.status(400).json({
        message: 'recipientId, providerId, verificationStatus, and envelopeId are required'
      });
    }

    const updatedRecord = await RecipientPermission.findOneAndUpdate(
      {
        recipientId,
        envelopeId,
        "authLevel.authMethodId": providerId
      },
      {
        $set: {
          "authLevel.$.status": verificationStatus
        }
      },
      {
        new: true
      }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        message: 'Recipient auth method not found'
      });
    }

    return res.status(200).json({
      message: 'Authentication status updated successfully',
    });

  } catch (err) {
    console.error('updateAuthStatus error', err);
    return res.status(500).json({
      message: 'Failed to update authentication status'
    });
  }
};
