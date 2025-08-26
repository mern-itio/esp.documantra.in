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
    const payload = {
      envelopeId: req.body.envelopeId,
      recipients: req.body.recipients
    };

    const response = await axios.post(
      `${ESIGN_API_BASE}/api/e-sign/add-recipients`,
      payload,
      {
        headers: {
          'Authorization': req.headers.authorization,
         'X-Sandbox-Api-Key': req.headers['x-sandbox-api-key'],
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(response.status).json(response.data);
  } catch (err) {
    return res.status(err.response ? err.response.status : 500).json(
      err.response ? err.response.data : { error: 'Proxy request failed', details: err.message }
    );
  }
};
const getEnvelopeDetail = async (req, res) => {
  try {
    const envelopeId = req.params.id;

    // Make GET request to microservice
    const response = await axios.get(
      `${ESIGN_API_BASE}/api/e-sign/envelope/${envelopeId}`,
      {
        headers: {
          'Authorization': req.headers.authorization,
         'X-Sandbox-Api-Key': req.headers['x-sandbox-api-key'],
          'Content-Type': 'application/json'
        }
      }
    );

    // Forward response
    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(
      err.response ? err.response.status : 500
    ).json(
      err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
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
          'Authorization': req.headers.authorization,
         'X-Sandbox-Api-Key': req.headers['x-sandbox-api-key'],
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

    const payload = {
      envelopeId: req.body.envelopeId,
      envelopeData: req.body.envelopeData
    };

    const response = await axios.put(
      `${ESIGN_API_BASE}/api/e-sign/update-envelope`, payload,
      {
        headers: {
          'Authorization': req.headers.authorization,
         'X-Sandbox-Api-Key': req.headers['x-sandbox-api-key'],
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

module.exports = { createEnvelope, forwardRecipientsRequest, saveSignatureFields, updateEnvelope, getEnvelopeDetail };
