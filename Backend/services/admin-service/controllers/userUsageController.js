const { serviceGet, servicePost } = require('../utils/apiHelper');
const { getUserPdfOperations: getPdfOps, getUserPdfStats: getPdfStats } = require('./pdfController');

// Get user's PDF operations with pagination and filtering
const getUserPdfOperations = async (req, res) => {
  return await getPdfOps(req, res);
};



// Get user's service statistics summary (PDF for now)
const getUserServiceStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ status: 400, message: 'User ID is required', data: null });
    }

    const query = new URLSearchParams();
    query.append('userId', userId);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    // Run both services in parallel and capture errors
    const [pdfResult, eSignResult] = await Promise.allSettled([
      serviceGet(req, 'pdf', { url: `/admin/user-stats?${query.toString()}` }),
      serviceGet(req, 'esign', { url: `/admin/user-stats?${query.toString()}` })
    ]);

    const payload = {
      pdf: pdfResult.status === 'fulfilled' && pdfResult.value.ok
        ? pdfResult.value.data?.data || pdfResult.value.data || {}
        : null,
      eSign: eSignResult.status === 'fulfilled' && eSignResult.value.ok
        ? eSignResult.value.data?.envelopeCount || null
        : null
    };

    // Prepare a message based on which service failed
    const errors = [];
    if (pdfResult.status === 'rejected' || (pdfResult.status === 'fulfilled' && !pdfResult.value.ok)) {
      errors.push('PDF service failed');
    }
    if (eSignResult.status === 'rejected' || (eSignResult.status === 'fulfilled' && !eSignResult.value.ok)) {
      errors.push('eSign service failed');
    }

    return res.status(200).json({
      status: 200,
      message: errors.length ? `Partial success: ${errors.join(', ')}` : 'Service statistics retrieved successfully',
      data: payload
    });

  } catch (err) {
    console.error('Unexpected error fetching user service stats:', err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Get user's operation history with detailed breakdown
const getUserOperationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, service, startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 400, 
        message: 'User ID is required', 
        data: null 
      });
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    if (service) queryParams.append('service', service);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Get operations from both services
    const [pdfResult, esignResult] = await Promise.all([
      serviceGet(req, 'pdf', { url: `/admin/user-operations?${queryParams.toString()}` }),
      serviceGet(req, 'esign', { url: `/admin/user-operations?${queryParams.toString()}` })
    ]);

    const operations = {
      pdf: pdfResult.ok ? (pdfResult.data?.data || { operations: [], pagination: {} }) : { operations: [], pagination: {} },
      esign: esignResult.ok ? (esignResult.data?.data || { operations: [], pagination: {} }) : { operations: [], pagination: {} }
    };

    return res.status(200).json({
      status: 200,
      message: 'Operation history retrieved successfully',
      data: operations
    });
  } catch (err) {
    console.error('Error fetching user operation history:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error', 
      data: null 
    });
  }
};

module.exports = {
  getUserPdfOperations,
  getUserServiceStats,
  getUserOperationHistory
};
