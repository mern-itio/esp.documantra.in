const Template = require("../models/Template");

const createTemplate =  async (req, res) => {
   const userId = req?.user?.data?.id;
   const payload = req.body;
   if(!payload.name || !payload.template_Slug || !payload.design || !payload.html){
    return res.status(401).json({success:false, message:"Required parameters are missing"});
   }
   if(userId){
    payload.createdBy = userId;
    payload.isAdmin = false;
    payload.isUser = true;
    payload.status = 'inactive';
    payload.isApproved = false;
   }

   console.log('Created By',payload.createdBy);
   const template = await Template.create({ ...payload});
   if (!template) {
       return res.status(400).json({ message: 'Template creation failed' });
   }
    return res.status(201).json({ status: 'success', data: template });
}

const updateTemplate = async (req, res) => {
    try{
        const {templateId} = req.params;
        const payload = req.body;
        const template = await Template.findByIdAndUpdate(
            templateId,
            payload,
            { new: true }
        );
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        return res.status(200).json({ status: 'success', data: template });
    }catch (err){
        console.log(err);
        return res.status(500).json({
            success:false,
            status:500,
            message:"Inernal Serer Error"
        });
    }
}
const fetchAllTemplates = async (req, res) => {
    const { userType } = req.params;
    console.log("User type:", userType);
    const query =
    userType === "admin"
        ? {}
        : { createdBy: req?.user?.data?.id };
    const templates = await Template.find(query);
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
    const {templateId} = req.params;
    console.log('Template Id in Email service',templateId);
    if(!templateId){
        return res.status(401).json({
            status:401,
            success:false,
            message:"Required parameters are missing"
        });
    }
    const template = await Template.findByIdAndDelete(templateId);
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