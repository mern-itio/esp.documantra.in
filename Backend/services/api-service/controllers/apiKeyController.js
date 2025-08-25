const APIKey = require('../models/apiKey');
const axios = require('axios');
const crypto = require('crypto');

module.exports ={
    createApiKey : async (req, res) => {
  try {
    const { mode, permissions } = req.body;
    const userId = req.user._id;

    // Only allow sandbox or production
    if (!['sandbox', 'production'].includes(mode)) {
      return res.status(400).json({ message: "Mode must be either 'sandbox' or 'production'" });
    }

    const key = `${mode === 'production' ? 'ds_live' : 'ds_test'}_${crypto.randomBytes(16).toString('hex')}`;
    const apiKey = new APIKey({
      key,
      mode,
      permissions,
      userId
    });
    await apiKey.save();

    res.status(201).json({ message: "API Key created", apiKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},
runApiTest : async (req, res) => {
  try {
    const { url, method, token, headers, body } = req.body;
    const apiKey = req.headers['x-api-key'];

    // Prepare request headers
    const requestHeaders = {
      ...headers,
      'Authorization': token ? `Bearer ${token}` : undefined,
      'x-api-key': apiKey,
    };

    // Axios config
    const config = {
      url,
      method: method || 'get',  // default: 'get'
      headers: requestHeaders,
      data: body || {},         // for POST/PUT
      timeout: 10000            // 10 sec timeout
    };

    // Make the API request
    const response = await axios(config);

    // Respond with result (status, body, headers)
    res.status(200).json({
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data
    });

  } catch (error) {
    // Error handling
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      data: error.response?.data,
      status: error.response?.status
    });
  }
},
runAllTestCases : async (req, res) => {
  const { testCases } = req.body;
  const apiKey = req.headers['x-api-key'];
  const results = [];

  for (const testCase of testCases) {
    try {
      const { url, method, token, headers, body } = testCase;
      // Prepare request headers
      const requestHeaders = {
        ...headers,
        'Authorization': token ? `Bearer ${token}` : undefined,
        'x-api-key': apiKey,
      };

      // Axios config
      const config = {
        url,
        method: method || 'get',
        headers: requestHeaders,
        data: body || {},
        timeout: 10000
      };

      const response = await axios(config);

      results.push({
        name: testCase.name,
        url,
        success: true,
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    } catch (error) {
      results.push({
        name: testCase.name,
        url,
        success: false,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  res.status(200).json({ results });
},
}
    

