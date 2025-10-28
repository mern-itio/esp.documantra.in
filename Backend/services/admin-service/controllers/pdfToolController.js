const PDFTool = require('../models/PDFTool');
const PDFToolActivation = require('../models/PDFToolActivation');

// List all tools (admin)
const listTools = async (req, res) => {
  try {
    const tools = await PDFTool.find({}).sort({ priority: 1, name: 1 });
    return res.status(200).json({ status: 200, data: tools });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

// Get single tool by id (admin)
const getTool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await PDFTool.findOne({ id });
    if (!tool) return res.status(404).json({ status: 404, message: 'Tool not found' });
    return res.status(200).json({ status: 200, data: tool });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

// Create tool (admin)
const createTool = async (req, res) => {
  try {
    const { id, name, description, category, priority, icon, complexity, avgProcessingTime, popularity } = req.body || {};
    if (!id || !name) return res.status(400).json({ status: 400, message: 'id and name are required' });
    const exists = await PDFTool.findOne({ id });
    if (exists) return res.status(409).json({ status: 409, message: 'Tool id already exists' });
    const created = await PDFTool.create({
      id,
      name,
      description: description || '',
      category: category || 'general',
      priority: typeof priority === 'number' ? priority : 0,
      icon: icon || '',
      complexity: ['easy','medium','advanced'].includes((complexity || '').toLowerCase()) ? (complexity || 'medium') : 'medium',
      avgProcessingTime: avgProcessingTime || '',
      popularity: typeof popularity === 'number' ? Math.max(0, Math.min(100, popularity)) : 50,
    });
    // Auto-activate newly created tools so they appear on user side by default
    await PDFToolActivation.updateOne(
      { toolId: id },
      { $set: { isActive: true, updatedBy: req.user?.email || 'system' } },
      { upsert: true }
    );
    return res.status(201).json({ status: 201, data: created });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

// Update tool (admin)
const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, priority, icon, complexity, avgProcessingTime, popularity } = req.body || {};
    const update = {};
    if (name != null) update.name = name;
    if (description != null) update.description = description;
    if (category != null) update.category = category;
    if (priority != null) update.priority = Number(priority);
    if (icon != null) update.icon = icon;
    if (complexity != null) update.complexity = ['easy','medium','advanced'].includes(String(complexity).toLowerCase()) ? complexity : undefined;
    if (avgProcessingTime != null) update.avgProcessingTime = avgProcessingTime;
    if (popularity != null) update.popularity = Math.max(0, Math.min(100, Number(popularity)));
    const updated = await PDFTool.findOneAndUpdate({ id }, update, { new: true });
    if (!updated) return res.status(404).json({ status: 404, message: 'Tool not found' });
    return res.status(200).json({ status: 200, data: updated });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

// Delete tool (admin)
const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PDFTool.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ status: 404, message: 'Tool not found' });
    // Clean up activation record
    await PDFToolActivation.deleteOne({ toolId: id });
    return res.status(200).json({ status: 200, data: { id: deleted.id } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

// Public list of tools (id and name only)
const listToolsPublic = async (req, res) => {
  try {
    const tools = await PDFTool.find(
      {},
      { _id: 1, id: 1, name: 1, description: 1, category: 1, priority: 1, icon: 1, complexity: 1, avgProcessingTime: 1, popularity: 1, createdAt: 1, updatedAt: 1 }
    ).sort({ priority: 1, name: 1 });
    return res.status(200).json({ status: 200, data: tools });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

module.exports = {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  listToolsPublic,
};


