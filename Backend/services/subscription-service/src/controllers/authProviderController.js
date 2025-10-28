const AuthProvider = require('../models/AuthProvider');
const Subscription = require('../models/Subscription');
const planTemplate = require('../models/PlanTemplate');

const addAuthProvider = async (req, res) => {
    const payload = req.body || {};
    if(!payload || !payload.name ) {
      return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
    }
    try{
    const authProvider = await AuthProvider.create({
      name: payload?.name,
      config: payload?.config || {},
      description: payload?.description || '',
      defaultCredits: payload?.defaultCredits || 1,
      uiSchema: payload?.uiSchema || {},
      enabled: payload?.enabled !== undefined ? payload.enabled : true,
      constraints: payload?.constraints || {},
      isRecommended: payload?.isRecommended || false
    });
    return res.status(201).json({ status: 201, message: 'Auth provider added', data: authProvider });
    }catch(error){
     console.error('Error adding auth provider:', error);
     return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null }); 
    }
};
const listAuthProviders = async (req, res) => {
  try {
    const providers = await AuthProvider.find().sort({ createdAt: -1 }); // newest first
    return res.status(200).json({
      status: 200,
      message: providers.length ? 'Auth providers fetched successfully' : 'No auth providers found',
      data: providers
    });
  } catch (error) {
    console.error('Error fetching auth providers:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
};
const updateAuthProvider = async (req, res) => {
  const id = req.params.id;
  const payload = req.body || {};

  // guard: don't allow changing the document _id
  if (payload._id && String(payload._id) !== String(id)) {
    return res.status(400).json({ status: 400, message: 'Cannot change provider _id' });
  }

  if (!id) {
    return res.status(400).json({ status: 400, message: 'Missing provider id in path' });
  }

  try {
    const provider = await AuthProvider.findById(id);
    if (!provider) {
      return res.status(404).json({ status: 404, message: 'Auth provider not found' });
    }

    // Build update object by merging incoming values, preserving existing values when absent
    const update = {};

    if ('name' in payload) update.name = payload.name;
    if ('description' in payload) update.description = payload.description;
    if ('defaultCredits' in payload) update.defaultCredits = Number(payload.defaultCredits) || 0;
    if ('enabled' in payload) update.enabled = !!payload.enabled;
    if ('isRecommended' in payload) update.isRecommended = !!payload.isRecommended;

    // CONFIG
    if ('config' in payload) {
      const cfg = payload.config || {};
      update.config = { ...(provider.config || {}) };
      if ('providerType' in cfg) update.config.providerType = cfg.providerType || '';
      if ('apiKeyRef' in cfg) update.config.apiKeyRef = cfg.apiKeyRef || '';
      if ('callbackUrl' in cfg) update.config.callbackUrl = cfg.callbackUrl || '';
      if ('requiredFields' in cfg) update.config.requiredFields = Array.isArray(cfg.requiredFields) ? cfg.requiredFields : [];
      // normalize extraFields (object preferred)
      update.config.extraFields = {};
      if (cfg.extraFields && typeof cfg.extraFields === 'object' && !Array.isArray(cfg.extraFields)) {
        update.config.extraFields = cfg.extraFields;
      } else if (Array.isArray(cfg.extraFields)) {
        cfg.extraFields.forEach(kv => { if (kv && kv.key) update.config.extraFields[kv.key] = kv.value; });
      } else {
        update.config.extraFields = provider.config?.extraFields || {};
      }
    }

    // UI SCHEMA
    if ('uiSchema' in payload) {
      const ui = payload.uiSchema || {};
      update.uiSchema = { ...(provider.uiSchema || {}) };
      if ('securityLevel' in ui) update.uiSchema.securityLevel = ui.securityLevel || 'Medium';
      if ('estimatedTime' in ui) update.uiSchema.estimatedTime = ui.estimatedTime || '';
      if ('costInfo' in ui) update.uiSchema.costInfo = ui.costInfo || '';
      if ('compliance' in ui) {
        if (Array.isArray(ui.compliance)) update.uiSchema.compliance = ui.compliance;
        else if (typeof ui.compliance === 'string') update.uiSchema.compliance = ui.compliance.split(',').map(s => s.trim()).filter(Boolean);
        else update.uiSchema.compliance = [];
      }
      if ('icon' in ui) update.uiSchema.icon = ui.icon || '';
      // extraFields
      update.uiSchema.extraFields = {};
      if (ui.extraFields && typeof ui.extraFields === 'object' && !Array.isArray(ui.extraFields)) {
        update.uiSchema.extraFields = ui.extraFields;
      } else if (Array.isArray(ui.extraFields)) {
        ui.extraFields.forEach(kv => { if (kv && kv.key) update.uiSchema.extraFields[kv.key] = kv.value; });
      } else {
        update.uiSchema.extraFields = provider.uiSchema?.extraFields || {};
      }
    }

    // CONSTRAINTS
    if ('constraints' in payload) {
      const c = payload.constraints || {};
      update.constraints = { ...(provider.constraints || {}) };
      if ('country' in c) {
        if (Array.isArray(c.country)) update.constraints.country = c.country;
        else if (typeof c.country === 'string') update.constraints.country = c.country.split(',').map(s => s.trim()).filter(Boolean);
        else update.constraints.country = [];
      }
      if ('maxAttempts' in c) {
        const ma = Number(c.maxAttempts);
        update.constraints.maxAttempts = Number.isFinite(ma) && ma > 0 ? ma : (provider.constraints?.maxAttempts ?? 3);
      }
    }

    update.updatedAt = new Date();

    // Persist update
    const updated = await AuthProvider.findByIdAndUpdate(id, { $set: update }, { new: true });
    return res.status(200).json({ status: 200, message: 'Auth provider updated', data: updated });
  } catch (err) {
    console.error('updateAuthProvider error:', err);
    // handle mongoose validation errors more verbosely if needed
    return res.status(500).json({ status: 500, message: 'Internal server error' });
  }
};
const toggleAuthProvider = async (req, res) => {
  const {id, enabled} = req.body || {};
  if(!id || typeof enabled !== 'boolean'){
      return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
  }
  try{
      const updatedProvider = await AuthProvider.findByIdAndUpdate(id, { enabled }, { new: true });
      if(!updatedProvider){
          return res.status(404).json({ status: 404, message: 'Auth provider not found', data: null });
      }
      return res.status(200).json({ status: 200, message: 'Auth provider updated successfully', data: updatedProvider });
  }catch(error){
      console.error('Error toggling auth provider:', error);
      return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}
const deleteAuthProvider = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: 'Missing auth provider ID',
        data: null
      });
    }

    const deletedProvider = await AuthProvider.findByIdAndDelete(id);

    if (!deletedProvider) {
      return res.status(404).json({
        status: 404,
        message: 'Auth provider not found',
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Auth provider deleted successfully',
      data: deletedProvider
    });
  } catch (error) {
    console.error('Error deleting auth provider:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
};
const availableAuthMethods = async (req, res) => {
  const userId = req.user?.data?.id;
  console.log('availableAuthMethods called for userId:', userId);
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Unauthorized: missing user information....',
      data: null
    });
  }
  try {
    // Fetch active subscription + plan
    const sub = await Subscription.findOne({ userId, status: 'active' })
      .populate('planTemplateId');
    if (!sub || !sub.planTemplateId){
      console.log('No active subscription found for userId:', userId);
      return res.status(404).json({ status: 404, message: 'No active subscription found' });
    }
    const plan = sub.planTemplateId;
    const authCosts = plan.authCosts || [];
    // Get IDs of providers listed in plan
    const authIds = authCosts.map(a => a.authId);
    // Fetch only those providers that match plan’s authIds and are enabled
    const providers = await AuthProvider.find({ _id: { $in: authIds }, enabled: true });
    // Map costs from plan for quick lookup
    const costMap = Object.fromEntries(authCosts.map(a => [String(a.authId), a.credits]));
    // Build formatted response
    const methods = providers.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      securityLevel: p.uiSchema?.securityLevel?.toLowerCase() || 'medium',
      estimatedTime: p.uiSchema?.estimatedTime || 'N/A',
      icon: p.uiSchema?.icon || 'Shield',
      cost: costMap[p._id.toString()] ?? p.defaultCredits,
      compliance: p.uiSchema?.compliance || [],
      available: true,
      isRecommended: p.isRecommended || false
    }));
    return res.json({ status: 200, message: 'OK', data: { methods } });

  } catch (error) {
    console.error('Error fetching available authentication methods:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
}
module.exports = {addAuthProvider, listAuthProviders, updateAuthProvider, toggleAuthProvider, deleteAuthProvider,availableAuthMethods};