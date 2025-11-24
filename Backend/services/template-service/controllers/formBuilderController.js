// controllers/formBuilderController.js
const Form = require('../models/formBuilder');
const FormFields = require('../models/formFields');
const FormSubmission = require('../models/FormSubmission'); 

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
    
    // Extract owner information from authenticated user
    const ownerId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    const owner = req.user?.data?.fullname || req.user?.fullname || null;
    
    const form = new Form({
      title, 
      description,
      ownerId,
      owner
    });
    await form.save();
    return res.status(200).json(form);

  }catch (err){
    console.log(err);
    return res.status(500).json({
      message:"Something went wrong, Please try again later."
    });
  }
}

const getAllForm = async (req, res) => {
  try{
    // Extract user ID from authenticated user (same pattern as createForm)
    const userId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "User not authenticated"
      });
    }
    
    // Filter forms by ownerId to show only user's own templates
    const form = await Form.find({ ownerId: userId }).sort({ createdAt: -1 });
    
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
    // Extract user ID from authenticated user
    const userId = req.user?.data?.id || req.user?.id || req.user?._id || null;

    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    // Verify user owns the form (only if ownerId exists)
    if (form.ownerId && userId && form.ownerId !== userId) {
      return res.status(403).json({ error: "You don't have permission to access this form" });
    }

    const fields = await FormFields.find({ formId: id }).sort('order');
   return res.json({ ...form.toObject(), fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch form", details: err.message });
  }

}

const addField = async (req, res) => {
  try {
    const { formId, fields } = req.body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "Fields array is required" });
    }

    // Build bulk operations
    const bulkOps = fields.map((field, index) => {
      if (field._id && !field._id.startsWith("field_")) {
        // Existing field in DB → update
        return {
          updateOne: {
            filter: { _id: field._id, formId },
            update: {
              $set: {
                type: field.type,
                label: field.label,
                placeholder: field.placeholder || '',
                required: field.required || false,
                options: field.options || [],
                validation: field.validation || {},
                updatedAt: new Date()
              }
            }
          }
        };
      } else {
        // New field → insert
        return {
          insertOne: {
            document: {
              formId,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder || '',
              required: field.required || false,
              options: field.options || [],
              validation: field.validation || {},
              order: index, // you can adjust based on last order if needed
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        };
      }
    });

    // Execute bulk operation
    const result = await FormFields.bulkWrite(bulkOps);

    return res.status(200).json({
      status: "success",
      result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add/update fields', details: err.message });
  }
};


const insertFormData = async (req, res) =>{
  try {
    const { formId, data } = req.body;

    // Validate input
    if (!formId || !data) {
      return res.status(400).json({ error: 'formId and data are required' });
    }

    // Check if form exists
    const formExists = await Form.findById(formId);
    if (!formExists) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Save submission
    const submission = new FormSubmission({
      formId: formId,
      data, // data is an object like { fieldId1: 'value1', fieldId2: 'value2' }
    });

    await submission.save();
    // Return success
    res.status(201).json({ message: 'Form submitted successfully', submissionId: submission._id });

  } catch (error) {
    console.error('Error saving form submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
// Get all submissions for a form
const getFormSubmissions = async (req, res) => {
  try {
    const { id } = req.params; // formId

    if (!id) {
      return res.status(400).json({ error: "Invalid formId" });
    }

    // 1. Fetch submissions for the form
    const submissions = await FormSubmission.find({ formId: id }).sort({
      createdAt: -1,
    });

    // 2. Fetch all fields for the form
    const fields = await FormFields.find({ formId: id });
    const fieldMap = {};
    fields.forEach((f) => {
      fieldMap[f._id.toString()] = f.label;
    });

    // 3. Map fieldIds to labels
    const formattedSubmissions = submissions.map((sub) => {
      const formatted = {};
      for (let [fieldId, value] of sub.data.entries()) {
        const label = fieldMap[fieldId] || fieldId; // fallback if missing
        formatted[label] = value;
      }
      return {
        _id: sub._id,
        formId: sub.formId,
        data: formatted,
        createdAt: sub.createdAt,
      };
    });

    res.status(200).json({ submissions: formattedSubmissions });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

// Delete a form and all associated data
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Form ID is required" });
    }

    // Check if form exists
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Check if user is the owner (restrict deletion to owner only)
    const ownerId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    if (form.ownerId && ownerId && form.ownerId !== ownerId) {
      return res.status(403).json({ error: "You don't have permission to delete this form" });
    }

    // Delete all associated data
    await Promise.all([
      Form.findByIdAndDelete(id), // Delete the form
      FormFields.deleteMany({ formId: id }), // Delete all form fields
      FormSubmission.deleteMany({ formId: id }) // Delete all form submissions
    ]);

    return res.status(200).json({
      status: "success",
      message: "Form and all associated data deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting form:", err);
    return res.status(500).json({
      error: "Failed to delete form",
      details: err.message
    });
  }
};

module.exports = {
    Test,
    createForm,
    getAllForm,
    addField,
    getFormDetail,
    insertFormData,
    getFormSubmissions,
    deleteForm
}