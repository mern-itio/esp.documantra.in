// templateController.js
const Template = require("../models/template");

// Create or Update a template
const saveUpdateTemplate = async (req, res) => {
  try {
    const { id, title, elements, status } = req.body;

    let template;
    if (id) {
      // Update existing template
      template = await Template.findByIdAndUpdate(
        id,
        { title, elements, status },
        { new: true, runValidators: true }
      );
    } else {
      // Create new template
      template = new Template({
        title,
        elements,
        status,
      });
      await template.save();
    }

    return res.status(200).json({
      success: true,
      message: id ? "Template updated successfully" : "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error saving/updating template:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving template",
      error: error.message,
    });
  }
};

module.exports = {
  Test,
  saveUpdateTemplate,
};
