const PDFToolSettings = require('../models/PDFToolSettings');

// Public endpoint to get tool settings for frontend
const getPublicToolSettings = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = { isActive: true }; // Only return active tools
    
    if (category) filter.category = category;
    
    const settings = await PDFToolSettings.find(filter)
      .select('toolId toolName category accessControl features display')
      .sort({ 'display.order': 1, toolName: 1 });
    
    return res.status(200).json({
      status: 200,
      message: 'Tool settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Get tool settings for a specific tool
const getToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const settings = await PDFToolSettings.findOne({ toolId, isActive: true })
      .select('toolId toolName category accessControl features display');
    
    if (!settings) {
      return res.status(404).json({
        status: 404,
        message: 'Tool settings not found',
        data: null
      });
    }
    
    return res.status(200).json({
      status: 200,
      message: 'Tool settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

module.exports = {
  getPublicToolSettings,
  getToolSettings
};
