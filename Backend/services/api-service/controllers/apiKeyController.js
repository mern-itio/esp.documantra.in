const ESignApiKey = require('../models/apiKey');
const axios = require('axios');
const crypto = require('crypto');

module.exports = {
   createApiKey: async (req, res) => {
    try {
      const userId = req.user.data.id;
      const mode = req.body.mode;

      if (!['sandbox', 'production'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode. Must be "sandbox" or "production".' });
      }

      // Correct model reference here
      const existingKey = await ESignApiKey.findOne({ userId, mode, isActive: true });
      if (existingKey) {
        return res.status(400).json({ error: `API key already exists for ${mode} mode.` });
      }

      const apiKey = crypto.randomBytes(32).toString('base64url');
      const limit = mode === 'sandbox' ? 10 : null;

      const now = new Date();
      const initialUsageLogs = [{
        year: now.getFullYear(),
        month: now.getMonth() + 1, // JS months are 0-indexed
        count: 0
      }];

      const keyDoc = new ESignApiKey({ userId, apiKey, mode, limit, usageCount: 0,usageLogs: initialUsageLogs, isActive: true, lastUsedAt: null });
      await keyDoc.save();

      res.status(201).json({
        apiKey,
        usageCount: 0,
        limit,
        mode,
        usageLogs: initialUsageLogs,
        lastUsedAt:null,
      });
    } catch (err) {
      console.error('API Key generation error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
  getAllApiKeys: async (req, res) => {
    try {
      const userId = req.user.data.id;
      const apiKeys = await ESignApiKey.find({ userId }).select('-__v');
      res.json({ apiKeys });
    } catch (err) {
      console.error('Error fetching API keys:', err);
      res.status(500).json({ error: 'Internal server error.' });
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
  };
    

