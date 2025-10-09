const PDFToolActivation = require('../models/PDFToolActivation');

const getActivation = async (req, res) => {
  try {
    const { toolId } = req.params;
    const doc = await PDFToolActivation.findOne({ toolId });
    return res.status(200).json({ status: 200, data: { toolId, isActive: doc ? doc.isActive : true } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

const setActivation = async (req, res) => {
  try {
    const { toolId } = req.params;
    const { isActive } = req.body || {};
    const doc = await PDFToolActivation.findOneAndUpdate(
      { toolId },
      { isActive: !!isActive, updatedBy: req.user?.email || 'admin' },
      { upsert: true, new: true }
    );
    return res.status(200).json({ status: 200, data: { toolId: doc.toolId, isActive: doc.isActive } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

module.exports = { getActivation, setActivation };
// Public (no auth) read endpoints
const getActivationPublic = async (req, res) => {
  try {
    const { toolId } = req.params;
    const doc = await PDFToolActivation.findOne({ toolId });
    return res.status(200).json({ status: 200, data: { toolId, isActive: doc ? doc.isActive : true } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

const getActiveToolIdsPublic = async (_req, res) => {
  try {
    const docs = await PDFToolActivation.find({ isActive: true }).select('toolId isActive');
    const data = docs.map(d => ({ toolId: d.toolId, isActive: d.isActive }));
    return res.status(200).json({ status: 200, data });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message });
  }
};

module.exports.getActivationPublic = getActivationPublic;
module.exports.getActiveToolIdsPublic = getActiveToolIdsPublic;


