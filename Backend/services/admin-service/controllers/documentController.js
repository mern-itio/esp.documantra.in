const { serviceGet, servicePatch } = require('../utils/apiHelper');

const getDocuments = async (req, res) => {
//   console.log('🔍 getDocuments called in admin service');
  const filterUserId = req.query.userId; // Optional query param to filter by userId
  try {
    let url = "/admin/fetch/documents";
    if (filterUserId) {
      url += `?userId=${filterUserId}`;
    }
    const result = await serviceGet(req, 'document', {
      url: url
    });
    console.log('Service result:', result);
    if (result.ok && result.status == 200) {
      // console.log('Documents data:', result.data);
      return res.status(200).json({
        status: 200,
        message: 'Documents fetched successfully',
        data: result.data.data
      })
    } else {
      console.log('Service returned non-200:', result);
      return res.status(404).json({
        status: 404,
        message: 'Documents not found.'
      })
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getSharedDocuments = async (req, res) => {
  const filterUserId = req.query.userId;
  try {
    let url = "/admin/fetch/shared-documents";
    if (filterUserId) {
      url += `?userId=${filterUserId}`;
    }
    const result = await serviceGet(req, 'document', { url });
    if (result.ok && result.status == 200) {
      return res.status(200).json({
        status: 200,
        message: 'Shared documents fetched successfully',
        data: result.data.data
      })
    } else {
      return res.status(404).json({
        status: 404,
        message: 'Shared documents not found.'
      })
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getSharedDocumentComments = async (req, res) => {
  try {
    const { shareToken } = req.params;
    // Use public comments endpoint to avoid auth constraints across services
    const result = await serviceGet(req, 'document', {
      url: `/public/pdf-share/${shareToken}/comments`
    });
    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'Comments fetched successfully',
        data: result.data?.data || result.data
      });
    } else {
      return res.status(result.status || 404).json({
        status: result.status || 404,
        message: result.message || 'Comments not found',
        data: null
      });
    }
  } catch (err) {
    console.error('Error fetching shared document comments:', err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getDocumentVersions = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await serviceGet(req, 'document', {
      url: `/admin/documents/${documentId}/versions`
    });
    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'Document versions fetched successfully',
        data: result.data.data || result.data
      });
    } else {
      return res.status(result.status || 404).json({
        status: result.status || 404,
        message: result.message || 'Versions not found',
        data: null
      });
    }
  } catch (err) {
    console.error('Error fetching versions:', err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getDocumentComments = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await serviceGet(req, 'document', {
      url: `/admin/documents/${documentId}/comments`
    });
    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'Document comments fetched successfully',
        data: result.data.data || result.data
      });
    } else {
      return res.status(result.status || 404).json({
        status: result.status || 404,
        message: result.message || 'Comments not found',
        data: null
      });
    }
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getDocumentWorkflows = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await serviceGet(req, 'document', {
      url: `/admin/documents/${documentId}/workflows`
    });
    if (result.ok) {
      return res.status(200).json({
        status: 200,
        message: 'Document workflows fetched successfully',
        data: result.data.data || result.data
      });
    } else {
      return res.status(result.status || 404).json({
        status: result.status || 404,
        message: result.message || 'Workflows not found',
        data: null
      });
    }
  } catch (err) {
    console.error('Error fetching workflows:', err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

module.exports = { getDocuments, getSharedDocuments, getSharedDocumentComments, getDocumentVersions, getDocumentComments, getDocumentWorkflows };

