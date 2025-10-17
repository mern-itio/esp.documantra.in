
const PDFToolSettings = require('../models/PDFToolSettings');

const { serviceGet, servicePatch } = require('../utils/apiHelper');
const userList = async (req, res) => {
  try {
    const result = await serviceGet(req, 'auth', { url: '/api-admin/user-list' });
    if (!result.ok) {
      return res.status(result.status).json({ status: result.status, message: result.message, data: null });
    }
    return res.status(200).json({
      status: 200,
      message: 'User list fetched successfully from auth-service',
      data: result.data?.data ?? result.data
    });
  } catch (error) {
    console.error('Error fetching user list from auth-service:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};
// PDF Tool Settings Management
const getPDFToolSettings = async (req, res) => {
  try {
    const { toolId, category, isActive } = req.query;
    const filter = {};
    
    if (toolId) filter.toolId = toolId;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const settings = await PDFToolSettings.find(filter).sort({ 'display.order': 1, toolName: 1 });
    
    return res.status(200).json({
      status: 200,
      message: 'PDF tool settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching PDF tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const createPDFToolSettings = async (req, res) => {
  try {
    // console.log('[createPDFToolSettings] Request received:', req.body);
    // console.log('[createPDFToolSettings] User:', req.user);
    
    const { toolId, toolName, category, accessControl, features, display } = req.body;
    const adminEmail = req.user?.email || 'system';
    
    // Check if tool already exists
    const existingTool = await PDFToolSettings.findOne({ toolId });
    if (existingTool) {
      return res.status(400).json({
        status: 400,
        message: 'Tool settings already exist for this tool ID',
        data: null
      });
    }
    
    const toolSettings = new PDFToolSettings({
      toolId,
      toolName,
      category,
      accessControl: accessControl || {
        allowedFor: 'all',
        customRules: {
          freeUsers: { enabled: true, limitType: 'number', limit: 10, timeWindow: 'daily' },
          proUsers: { enabled: true, limitType: 'unlimited', limit: null, timeWindow: 'daily' },
          guests: { enabled: true, limitType: 'number', limit: 5, timeWindow: 'daily' }
        }
      },
      features: features || {
        requiresAuth: false,
        requiresPremium: false,
        showInMenu: true,
        showInHeader: false,
        isPopular: false
      },
      display: display || {
        badge: null,
        icon: 'FileText',
        description: '',
        order: 0
      },
      createdBy: adminEmail,
      updatedBy: adminEmail
    });
    
    await toolSettings.save();
    
    return res.status(201).json({
      status: 201,
      message: 'PDF tool settings created successfully',
      data: toolSettings
    });
  } catch (error) {
    console.error('Error creating PDF tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const updatePDFToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    const updateData = req.body;
    const adminEmail = req.user?.email || 'system';
    
    // Remove fields that shouldn't be updated
    delete updateData.toolId;
    delete updateData.createdBy;
    updateData.updatedBy = adminEmail;
    
    const toolSettings = await PDFToolSettings.findOneAndUpdate(
      { toolId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!toolSettings) {
      return res.status(404).json({
        status: 404,
        message: 'PDF tool settings not found',
        data: null
      });
    }
    
    return res.status(200).json({
      status: 200,
      message: 'PDF tool settings updated successfully',
      data: toolSettings
    });
  } catch (error) {
    console.error('Error updating PDF tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const deletePDFToolSettings = async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const toolSettings = await PDFToolSettings.findOneAndDelete({ toolId });
    
    if (!toolSettings) {
      return res.status(404).json({
        status: 404,
        message: 'PDF tool settings not found',
        data: null
      });
    }
    
    return res.status(200).json({
      status: 200,
      message: 'PDF tool settings deleted successfully',
      data: toolSettings
    });
  } catch (error) {
    console.error('Error deleting PDF tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Bulk operations
const bulkUpdatePDFToolSettings = async (req, res) => {
  try {
    const { updates } = req.body;
    const adminEmail = req.user?.email || 'system';
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Updates array is required',
        data: null
      });
    }
    
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { toolId: update.toolId },
        update: { 
          $set: { 
            ...update.data, 
            updatedBy: adminEmail 
          } 
        }
      }
    }));    
    const result = await PDFToolSettings.bulkWrite(bulkOps);    
    return res.status(200).json({
      status: 200,
      message: 'Bulk update completed successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error bulk updating PDF tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Initialize default tool settings from mock data
const initializeDefaultToolSettings = async (req, res) => {
  try {
    const adminEmail = req.user?.email || 'system';
    
    // This would typically import from the mock data
    // For now, we'll create a few example tools
    const defaultTools = [
      {
        toolId: 'pdf-to-word',
        toolName: 'PDF to Word',
        category: 'conversion',
        accessControl: {
          allowedFor: 'all',
          customRules: {
            freeUsers: { enabled: true, limitType: 'number', limit: 10, timeWindow: 'daily' },
            proUsers: { enabled: true, limitType: 'unlimited', limit: null, timeWindow: 'daily' },
            guests: { enabled: true, limitType: 'number', limit: 5, timeWindow: 'daily' }
          }
        },
        features: {
          requiresAuth: false,
          requiresPremium: false,
          showInMenu: true,
          showInHeader: false,
          isPopular: true
        },
        display: {
          badge: 'Popular',
          icon: 'FileText',
          description: 'Convert PDF to editable Word documents',
          order: 1
        }
      },
      {
        toolId: 'compress-pdf',
        toolName: 'Compress PDF',
        category: 'optimization',
        accessControl: {
          allowedFor: 'all',
          customRules: {
            freeUsers: { enabled: true, limitType: 'number', limit: 10, timeWindow: 'daily' },
            proUsers: { enabled: true, limitType: 'unlimited', limit: null, timeWindow: 'daily' },
            guests: { enabled: true, limitType: 'number', limit: 5, timeWindow: 'daily' }
          }
        },
        features: {
          requiresAuth: false,
          requiresPremium: false,
          showInMenu: true,
          showInHeader: false,
          isPopular: true
        },
        display: {
          badge: 'Popular',
          icon: 'Archive',
          description: 'Reduce PDF file size while maintaining quality',
          order: 2
        }
      }
    ];
    
    const createdTools = [];
    
    for (const tool of defaultTools) {
      const existingTool = await PDFToolSettings.findOne({ toolId: tool.toolId });
      if (!existingTool) {
        const toolSettings = new PDFToolSettings({
          ...tool,
          createdBy: adminEmail,
          updatedBy: adminEmail
        });
        await toolSettings.save();
        createdTools.push(toolSettings);
      }
    }
    
    return res.status(201).json({
      status: 201,
      message: 'Default tool settings initialized successfully',
      data: createdTools
    });
  } catch (error) {
    console.error('Error initializing default tool settings:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const userStatusToggle = async (req, res) =>{
  const {id} = req.params;
  const {status} = req.body;
  try{
    const result = await servicePatch(req, 'auth', {
      url: `/api-admin/user-status/toggle/${id}`,
      data: { status }
    });
    if(result.status == 200){
      return res.status(200).json({
        status:200,
        message:'User status updated successfully',
        data: result.data.data
      })
    }else{
      return res.status(404).json({
        status: 404,
        message:'User not found.'
      })
    }

  }catch (err){
    console.log('Error toggle user from auth service');
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getUserDetail = async ( req, res) =>{
  const {id} = req.params;
  try{
    const result = await serviceGet(req,'auth',{url: `/api-admin/user-detail/${id}`});
    if(result.status==200){
      return res.status(200).json({
        status:200,
        message:'User details fetched successfully',
        data:result.data.data
      });
    }
  }catch (err){
    console.log(err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const updateUserDetail = async (req, res) => {
  const {id} = req.params;
  const {fullname, email, phone, status} = req.body;
  if(!id) {
      return res.status(400).json({ status: 400, message: 'User ID is required', data: null });
  }

    // Prepare update object dynamically
    const updateFields = {};
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (status !== undefined) updateFields.status = status;
  try{
    const result = await servicePatch(req, 'auth',{
      url:`/api-admin/user/update/${id}`,
      data: {data:updateFields}
    })
    if(result.status == 200){
      return res.status(200).json({
        status:200,
        message:'User updated successfully',
        data: result.data.data
      });
    }

  }catch (err){
    console.log(err);
    return res.status(500).json({ status:500, message: 'Internal Server Error', data:null});
  }
}

const updateUserPassword = async (req, res) => {
const {id} = req.params;
const {password} = req.body;
  if(!id) {
      return res.status(400).json({ status: 400, message: 'User ID is required', data: null });
  }
try{
  const result = await servicePatch(req, 'auth',{
    url:`/api-admin/user/password/${id}`,
    data: {password:password}
  });
  if(result.status==200){
    return res.status(200).json({
      status:200,
      message:'User updated successfully',
      data: result.data.data
    });
  }
}catch{
  console.log(err);
  return res.status(500).json({ status:500, message: 'Internal Server Error', data:null});
}
}
module.exports = { userList,userStatusToggle,getUserDetail,updateUserDetail,updateUserPassword,
  getPDFToolSettings,
  createPDFToolSettings,
  updatePDFToolSettings,
  deletePDFToolSettings,
  bulkUpdatePDFToolSettings,
  initializeDefaultToolSettings 
};

