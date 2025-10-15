const { serviceGet, servicePost } = require('../utils/apiHelper');

// Get user's PDF operations with pagination and filtering
const getUserPdfOperations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, operation, category, status, startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'User ID is required', 
        data: null 
      });
    }

    // Build query parameters for PDF service
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (operation) queryParams.append('operation', operation);
    if (category) queryParams.append('category', category);
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Call PDF service admin API
    const result = await serviceGet(req, 'pdf', {
      url: `/admin/user-operations?${queryParams.toString()}`
    });

    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'PDF operations retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        message: result.message || 'Failed to retrieve PDF operations',
        data: result.data || null
      });
    }
  } catch (err) {
    console.error('Error fetching user PDF operations:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Get user's PDF operation statistics
const getUserPdfStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'User ID is required', 
        data: null 
      });
    }

    // Build query parameters for PDF service
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Call PDF service admin API
    const result = await serviceGet(req, 'pdf', {
      url: `/admin/user-stats?${queryParams.toString()}`
    });

    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'PDF statistics retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        message: result.message || 'Failed to retrieve PDF statistics',
        data: result.data || null
      });
    }
  } catch (err) {
    console.error('Error fetching user PDF stats:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Get all users' PDF operation statistics (admin overview)
const getAllUsersPdfStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build query parameters for PDF service
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Call PDF service admin API
    const result = await serviceGet(req, 'pdf', {
      url: `/admin/all-users-stats?${queryParams.toString()}`
    });

    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'All users PDF statistics retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        message: result.message || 'Failed to retrieve all users PDF statistics',
        data: result.data || null
      });
    }
  } catch (err) {
    console.error('Error fetching all users PDF stats:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Get PDF operation details by ID
const getPdfOperationById = async (req, res) => {
  try {
    const { operationId } = req.params;
    
    if (!operationId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Operation ID is required', 
        data: null 
      });
    }

    // Call PDF service admin API
    const result = await serviceGet(req, 'pdf', {
      url: `/admin/operation/${operationId}`
    });

    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'PDF operation details retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        message: result.message || 'Failed to retrieve PDF operation details',
        data: result.data || null
      });
    }
  } catch (err) {
    console.error('Error fetching PDF operation details:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

// Delete PDF operation (admin only)
const deletePdfOperation = async (req, res) => {
  try {
    const { operationId } = req.params;
    
    if (!operationId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Operation ID is required', 
        data: null 
      });
    }

    // Call PDF service admin API
    const result = await serviceGet(req, 'pdf', {
      url: `/admin/operation/${operationId}`,
      method: 'DELETE'
    });

    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'PDF operation deleted successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        message: result.message || 'Failed to delete PDF operation',
        data: result.data || null
      });
    }
  } catch (err) {
    console.error('Error deleting PDF operation:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

module.exports = {
  getUserPdfOperations,
  getUserPdfStats,
  getAllUsersPdfStats,
  getPdfOperationById,
  deletePdfOperation
};
