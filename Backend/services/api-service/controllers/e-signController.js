const fs = require('fs');
const axios = require('axios'); 
const FormData = require('form-data'); 
const ESIGN_API_BASE = process.env.ESIGN_URL ;

const createEnvelope = async (req, res) => {
  try {
    
    // Prepare form-data for proxy (using formidable, multer, etc.)
    const formData = new FormData();
    if (req.body.envelopeId) formData.append('envelopeId', req.body.envelopeId);
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        formData.append('files', fs.createReadStream(file.path), file.originalname);
      });
    }
    // Forward request to e-sign microservice
    const response = await axios.post(
      `${ESIGN_API_BASE}/api/e-sign/upload`,
      formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return res.status(response.status).json(response.data);
} catch (err) {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  return res.status(500).json({ error: 'Failed to create envelope', details: err.message });
}
};  
const forwardRecipientsRequest = async (req, res) => {
  try {
    // Prepare form-data from request
    const formData = new FormData();
    if (req.body.envelopeId) formData.append('envelopeId', req.body.envelopeId);
    if (req.body.recipients) formData.append('recipients', JSON.stringify(req.body.recipients));
    // Attach any files if required
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        formData.append('files', fs.createReadStream(file.path), file.originalname);
      });
    }

    // Forward request to e-sign microservice
    const response = await axios.post(
      `${ESIGN_API_BASE}/api/e-sign/add-recipients`,
      formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization,  // Pass auth headers if needed
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    // Send back the microservice response
    return res.status(response.status).json(response.data);
  } catch (err) {
    return res.status(err.response ? err.response.status : 500).json(
      err.response ? err.response.data : { error: 'Proxy request failed', details: err.message }
    );
  }
};
const saveSignatureFields = async (req, res) => {
  try {
    // Prepare payload for forwarding
    const payload = {
      signatureFields: req.body.signatureFields,
      envelopeId: req.body.envelopeId
    };

    const response = await axios.post(
      `${ESIGN_API_BASE}/api/e-sign/save-signature-fields`,
      payload,
      {
        headers: {
          'Authorization': req.headers.authorization, // Forward auth headers if needed
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(response.status).json(response.data);

  } catch (err) {
    return res.status(
      err.response ? err.response.status : 500
    ).json(
      err.response ? err.response.data : { error: 'Proxy request failed', details: err.message }
    );
  }
};
const updateEnvelope = async (req, res) => {
  try {
    const url = `${ESIGN_API_BASE}/api/e-sign/save-signature-fields/update-envelope`; // ESIGN_API_BASE is your microservice base URL

    const payload = {
      envelopeId: req.body.envelopeId,
      envelopeData: req.body.envelopeData
    };

    const response = await axios.put(url, payload, {
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    return res.status(
      err.response ? err.response.status : 500
    ).json(
      err.response ? err.response.data : { error: 'Proxy request failed', details: err.message }
    );
  }
};

module.exports = { createEnvelope, forwardRecipientsRequest, saveSignatureFields, updateEnvelope };
