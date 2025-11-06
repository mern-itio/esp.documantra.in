const Recipient = require('../models/Recipient');

// List recipients (optionally by current user in future)
exports.listRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: recipients });
  } catch (err) {
    console.error('listRecipients error', err);
    return res.status(500).json({ message: 'Failed to fetch recipients' });
  }
};

// Create recipient
exports.createRecipient = async (req, res) => {
  try {
    const { name, email, title = '', company = '', phone = '', address = '', signature = '' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const created = await Recipient.create({ name, email, title, company, phone, address, signature });
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error('createRecipient error', err);
    return res.status(500).json({ message: 'Failed to create recipient' });
  }
};

// Update recipient
exports.updateRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, title, company, phone, address, signature } = req.body;
    const updated = await Recipient.findByIdAndUpdate(
      id,
      { $set: { name, email, title, company, phone, address, signature } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('updateRecipient error', err);
    return res.status(500).json({ message: 'Failed to update recipient' });
  }
};

// Delete recipient
exports.deleteRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Recipient.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    return res.status(200).json({ message: 'Recipient deleted' });
  } catch (err) {
    console.error('deleteRecipient error', err);
    return res.status(500).json({ message: 'Failed to delete recipient' });
  }
};


