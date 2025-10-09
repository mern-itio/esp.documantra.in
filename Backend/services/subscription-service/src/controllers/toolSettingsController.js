const ToolSettings = require('../models/ToolSettings');



// Create tool settings (admin)
const createToolSettings = async (req, res) => {
  try {
    const { toolId, toolName, category, accessControl, features, display } = req.body;
    const adminEmail = req.user?.email || 'system';
    
    // Check if tool already exists
    const existingTool = await ToolSettings.findOne({ toolId });
    if (existingTool) {
      return res.status(400).json({
        status: 400,
        message: 'Tool settings already exist for this tool',
        data: null
      });
    }
    
    const toolSettings = await ToolSettings.create({
      toolId,
      toolName,
      category,
      accessControl: accessControl || {},
      features: features || {},
      display: display || {},
      createdBy: adminEmail,
      updatedBy: adminEmail
    });
    
    return res.status(201).json({
      status: 201,
      message: 'Tool settings created successfully',
      data: toolSettings
    });
  } catch (error) {
    console.error('Error creating tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Update tool settings (admin)
const updateToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    const updateData = req.body;
    const adminEmail = req.user?.email || 'system';
    
    const toolSettings = await ToolSettings.findOneAndUpdate(
      { toolId },
      { ...updateData, updatedBy: adminEmail },
      { new: true, runValidators: true }
    );
    
    if (!toolSettings) {
      return res.status(404).json({
        status: 404,
        message: 'Tool settings not found',
        data: null
      });
    }
    
    return res.status(200).json({
      status: 200,
      message: 'Tool settings updated successfully',
      data: toolSettings
    });
  } catch (error) {
    console.error('Error updating tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Delete tool settings (admin)
const deleteToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const toolSettings = await ToolSettings.findOneAndDelete({ toolId });
    
    if (!toolSettings) {
      return res.status(404).json({
        status: 404,
        message: 'Tool settings not found',
        data: null
      });
    }
    
    return res.status(200).json({
      status: 200,
      message: 'Tool settings deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Public: Get all active tool settings (no auth)
const getPublicToolSettings = async (req, res) => {
  try {
    const settings = await ToolSettings.find({ isActive: true }).select('-createdBy -updatedBy -createdAt -updatedAt -__v');
    return res.status(200).json({ status: 200, message: 'Public tool settings fetched successfully', data: settings });
  } catch (error) {
    console.error('Error fetching public tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Public: Get specific tool settings by toolId (no auth)
const getToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    const settings = await ToolSettings.findOne({ toolId, isActive: true }).select('-createdBy -updatedBy -createdAt -updatedAt -__v');
    if (!settings) {
      return res.status(404).json({ status: 404, message: 'Tool settings not found or inactive', data: null });
    }
    return res.status(200).json({ status: 200, message: 'Public tool settings fetched successfully', data: settings });
  } catch (error) {
    console.error(`Error fetching public tool settings for ${toolId}:`, error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

module.exports = {
  getToolSettings,
  createToolSettings,
  updateToolSettings,
  deleteToolSettings,
  getPublicToolSettings,
  getToolSettings: getToolSettings
};
