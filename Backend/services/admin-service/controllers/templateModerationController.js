const { serviceGet, servicePut, servicePatch, servicePost, serviceDel } = require('../utils/apiHelper');
const axios = require('axios');

const listTemplates = async (req, res) => {
  const result = await serviceGet(req, 'template', {
    url: '/api/template/admin/templates',
    params: req.query,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const updateTemplate = async (req, res) => {
  const result = await servicePut(req, 'template', {
    url: `/api/template/admin/templates/${encodeURIComponent(req.params.id)}`,
    data: req.body,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const setApproval = async (req, res) => {
  const result = await servicePatch(req, 'template', {
    url: `/api/template/admin/templates/${encodeURIComponent(req.params.id)}/approval`,
    data: req.body,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const generateAndActivateTemplate = async (req, res) => {
  const result = await servicePost(req, 'template', {
    url: '/api/template/admin/templates/generate-ai',
    data: req.body,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(201).json(result.data);
};

const listTemplateTypes = async (req, res) => {
  const result = await serviceGet(req, 'template', {
    url: '/api/template/admin/template-types',
    params: req.query,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const createTemplateType = async (req, res) => {
  const result = await servicePost(req, 'template', {
    url: '/api/template/admin/template-types',
    data: req.body,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(201).json(result.data);
};

const updateTemplateType = async (req, res) => {
  const result = await servicePut(req, 'template', {
    url: `/api/template/admin/template-types/${encodeURIComponent(req.params.id)}`,
    data: req.body,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const deleteTemplateType = async (req, res) => {
  const result = await serviceDel(req, 'template', {
    url: `/api/template/admin/template-types/${encodeURIComponent(req.params.id)}`,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const generateTemplateContent = async (req, res) => {
  const result = await servicePost(req, 'template', {
    url: '/public/ai-content/generate',
    data: req.body,
    timeout: 120000,
  });
  if (!result.ok) return res.status(result.status).json({ message: result.message, data: result.data });
  return res.status(200).json(result.data);
};

const generateTemplateContentStream = async (req, res) => {
  try {
    const baseURL = process.env.TEMPLATE_SERVICE_URL || 'http://165.22.215.73:2106';
    const upstream = await axios.post(`${baseURL}/public/ai-content/generate-stream`, req.body, {
      responseType: 'stream',
      timeout: 180000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    upstream.data.pipe(res);
    upstream.data.on('end', () => {
      res.end();
    });
    upstream.data.on('error', () => {
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      res.end();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stream content',
      error: error.message,
    });
  }
};

module.exports = {
  listTemplates,
  updateTemplate,
  setApproval,
  generateAndActivateTemplate,
  listTemplateTypes,
  createTemplateType,
  updateTemplateType,
  deleteTemplateType,
  generateTemplateContent,
  generateTemplateContentStream,
};

