const fs = require('fs');
const axios = require('axios'); 
const FormData = require('form-data'); 
const ESIGN_API_BASE =
  process.env.ESIGN_URL ||
  process.env.ESIGN_SERVICE_URL ||
  process.env.ESING_SERVICE_URL ||
  'http://127.0.0.1:2103';

const { incrementSandboxKeyUsage } = require('../utils/recordSandboxKeyUsage');

function buildProxyHeaders(req, extra = {}) {
  const headers = { ...extra };
  if (req.authToken) {
    headers.Authorization = `Bearer ${req.authToken}`;
  } else if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  if (req.headers.cookie) {
    headers.Cookie = req.headers.cookie;
  }
  if (req.headers['x-sandbox-api-key']) {
    headers['X-Sandbox-Api-Key'] = req.headers['x-sandbox-api-key'];
  }
  return headers;
}

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
          ...buildProxyHeaders(req),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

   res.locals.analyticsResponse = {
    status: response.status,
    statusText: response.statusText,
    message: response.data.message || response.data.status || 'Success',
    data: response.data
  };
    return res.status(response.status).json(response.data);
}catch (err) {
  console.error('Error:', err);
  const status = err.response?.status || 500;
  res.locals.analyticsResponse = {
    status,
    statusText: err.response?.statusText || 'Error',
    message: err.response?.data?.message || err.message,
    data: err.response?.data || { error: 'Proxy request failed', details: err.message || 'Unknown error' },
  };
  return res.status(status).json(
    err.response?.data || { error: 'Proxy request failed', details: err.message || 'Unknown error' },
  );
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
        headers: buildProxyHeaders(req, { 'Content-Type': 'application/json' }),
      }
    );
    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};
const getEnvelopeDetail = async (req, res) => {
  try {
    console.log("endpoint Hiiited");
    const envelopeId = req.params.id;

    // Make GET request to microservice
    const response = await axios.get(
      `${ESIGN_API_BASE}/api/e-sign/envelope/${envelopeId}`,
      {
        headers: buildProxyHeaders(req, { 'Content-Type': 'application/json' }),
      }
    );
    
    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
    // Forward response with correct status
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
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
        headers: buildProxyHeaders(req, { 'Content-Type': 'application/json' }),
      }
    );

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);

  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};
const updateEnvelope = async (req, res) => {
  try {
    const payload = {
      envelopeId: req.body.envelopeId,
      envelopeData: req.body.envelopeData
    };

    const response = await axios.post(
      `${ESIGN_API_BASE}/api/e-sign/update-envelope`, payload,
      {
        headers: buildProxyHeaders(req, { 'Content-Type': 'application/json' }),
    });

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
    // Forward response with correct status
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};
const sendEnvelope = async (req, res) => {
  try {
    const { envelopeId } = req.params;

    const headers = buildProxyHeaders(req, { 'Content-Type': 'application/json' });

    const response = await axios.post(`${ESIGN_API_BASE}/api/e-sign/send-envelope/${envelopeId}`, {}, { headers });

    if (response.status >= 200 && response.status < 300 && req.keyDoc) {
      await incrementSandboxKeyUsage(req.keyDoc);
    }

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
    // Forward response with correct status
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};
const getSignatureFields = async (req, res) => {
  try {
    const { id } = req.params;

    const headers = buildProxyHeaders(req, { 'Content-Type': 'application/json' });

    const response = await axios.get(`${ESIGN_API_BASE}/api/e-sign/public/document/signature-fields/${id}`, { headers });

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
    // Forward response with correct status
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};
const addSignature = async (req, res) => {
  try {
    const payload = {
      fieldId: req.body.fieldId,
      signature: req.body.signature
    };

    const headers = buildProxyHeaders(req, { 'Content-Type': 'application/json' });

    // Forward POST request to microservice
    const response = await axios.post(`${ESIGN_API_BASE}/api/e-sign/public/add-signature`, payload, { headers });

    if (response.status >= 200 && response.status < 300 && req.keyDoc) {
      await incrementSandboxKeyUsage(req.keyDoc, { fieldId: payload.fieldId });
    }

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message:response.data.status,
      data: response.data
    };
    return res.status(response.status).json(response.data);
    // Forward response with correct status
  } catch (err) {
    console.error('Error:', err);
    res.locals.analyticsResponse = {
      status: err.response ? err.response.status : 500,
      statusText: err.response ? err.response.statusText : "Error",
      message:err.response ? err.response.data.message: "Error",
      data: err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
    };
  return res.status(
    err.response ? err.response.status : 500
  ).json(
    err.response ? err.response.data : { error: 'Proxy request failed', details: err.message || 'Unknown error' }
  );
}
};

const SUBSCRIPTION_API_BASE = (
  process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110'
).replace(/\/+$/, '');

/**
 * Partner S2S: start recipient authentication (DigiLocker, OTP, etc.).
 * Returns verificationUrl for redirect when action is COMPLETE_IDENTITY_VERIFICATION.
 */
const initiateRecipientAuth = async (req, res) => {
  try {
    const { providerId, recipientData, envelopeId } = req.body || {};
    if (!providerId || !recipientData || !envelopeId) {
      return res.status(400).json({
        error: 'providerId, recipientData, and envelopeId are required',
      });
    }

    const response = await axios.post(
      `${SUBSCRIPTION_API_BASE}/api/authproviders/initiate/auth`,
      { providerId, recipientData, envelopeId },
      {
        headers: buildProxyHeaders(req, { 'Content-Type': 'application/json' }),
      }
    );

    res.locals.analyticsResponse = {
      status: response.status,
      statusText: response.statusText,
      message: response.data?.message || response.data?.action,
      data: response.data,
    };

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error('initiateRecipientAuth error:', err.response?.data || err.message);
    res.locals.analyticsResponse = {
      status: err.response?.status || 500,
      statusText: err.response?.statusText || 'Error',
      message: err.response?.data?.message || err.message,
      data: err.response?.data || { error: 'Auth initiation failed' },
    };
    return res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Auth initiation failed', details: err.message }
    );
  }
};

module.exports = { createEnvelope, forwardRecipientsRequest, saveSignatureFields, updateEnvelope, getEnvelopeDetail, sendEnvelope, getSignatureFields, addSignature, initiateRecipientAuth };
