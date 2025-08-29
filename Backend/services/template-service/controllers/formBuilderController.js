// controllers/formBuilderController.js
const Form = require('../models/formBuilder');
const FormFields = require('../models/formFields');

const Test = async (req, res) => {
 return res.send(`Template service is running ${req.user?.data?.fullname || ''}`);
}

const createForm = async (req, res) => {
  try{
    const {title, description} = req.body;
    if(!title){
      console.error("Title field is required...");
      return res.status(400).json({
        message:"Title field is required."
      });
    }
    if(!description){
      console.error("Description is required.");
      return res.status(400).json({
        message:"Description field is required."
      });
    }
    const form = new Form({title, description});
    await form.save();
    return res.status(200).json(form);

  }catch (err){
    console.log(err);
  }
}

const getAllForm = async (req, res) => {
  try{
    const form = await Form.find().sort({ createdAt: -1 });
    if(!form) return res.status(404).json({error:'Form not found.'});
    return res.status(200).json({
      status:"success",
      form:form
    });

  }catch (err){
    console.log(err);
    return res.status(500).json({
      message:"Somthing went wrong, Please try again later."
    });
  }
}

const getFormDetail = async(req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    const fields = await FormFields.find({ formId: id }).sort('order');
   return res.json({ ...form.toObject(), fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch form", details: err.message });
  }

}

const addField = async (req, res) => {
try {
    const { formId, fields } = req.body; // expecting an array of fields
    console.log("Here")

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(404).json({ error: "Fields array is required" });
    }

    // Find current max order to append new fields
    const lastField = await FormFields.findOne({ formId }).sort('-order');
    let baseOrder = lastField ? lastField.order + 1 : 0;

    // Prepare fields with order
    const fieldsToInsert = fields.map((field, index) => ({
      formId,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required || false,
      options: field.options || [],
      validation: field.validation || {},
      order: baseOrder + index
    }));

    // Insert many at once
    const savedFields = await FormFields.insertMany(fieldsToInsert);
    return res.status(200).json({
      formfields:savedFields,
      status:"success",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add fields', details: err.message });
  }
}

module.exports = {
    Test,
    createForm,
    getAllForm,
    addField,
    getFormDetail
}