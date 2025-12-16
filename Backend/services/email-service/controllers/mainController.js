const Template = require("../models/Template");

const createTemplate =  async (req, res) => {
   const { name, html, design, userId } = req.body;
   const template = await Template.create({ name, html, design, userId });
   if (!template) {
       return res.status(400).json({ message: 'Template creation failed' });
   }
    return res.status(201).json({ status: 'success', data: template });
}

const updateTemplate = async (req, res) => {
     const template = await Template.findByIdAndUpdate(
    req.templateId,
    req.body,
    { new: true }
  );
    if (!template) {
         return res.status(404).json({ message: 'Template not found' });
    }
    return res.status(200).json({ status: 'success', data: template });
}
const fetchAllTemplates = async (req, res) => {
    const templates = await Template.find({ userId: req.user.data.id });
    return res.status(200).json({ status: 'success', data: templates });
}
const getTemplateById = async (req, res) => {
    const template = await Template.findById(req.templateId);
    if (!template) {
        return res.status(404).json({ message: 'Template not found' });
    }
    return res.status(200).json({ status: 'success', data: template });
}
const deleteTemplate = async (req, res) => {
    const template = await Template.findByIdAndDelete(req.templateId);
    if (!template) {
        return res.status(404).json({ message: 'Template not found' });
    }
    return res.status(200).json({ status: 'success', message: 'Template deleted' });
}
const getTemplateBySlug = async (req, res) => {
    const template = await Template.findOne({ slug: req.params.slug });
    if (!template) {
        return res.status(404).json({ message: 'Template not found' });
    }
    return res.status(200).json({ status: 'success', data: template });
}
module.exports = { createTemplate, updateTemplate, getTemplateById, deleteTemplate,fetchAllTemplates,getTemplateBySlug };