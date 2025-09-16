const SupportTicket = require('../models/supportTickets');

exports.createSupportTicket = async (req, res) => {
  try {
    const { title, category, priority, description } = req.body;
    const userId = req.user.data.id;
    // Validation (basic)
    if (!title || !category || !priority || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const ticket = new SupportTicket({ title, category, priority, description, userId });

    await ticket.save();

    return res.status(201).json({ message: "Ticket created successfully", ticketId: ticket._id});
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
// GET /api/support-tickets
exports.getAllSupportTickets = async (req, res) => {
  try {
    const userId = req.user.data.id; // Make sure auth middleware sets this!
    const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 }); // latest first
    res.status(200).json(tickets); // array of ticket objects
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
