//models/formBuilder.js
const mongoose = require('mongoose');

const FormBuilderSchema = new mongoose.Schema(
    {
        title:{type:String, required: true},
        description:{type:String},
        content:{type:String}, // For storing AI-generated document content (plain text)
        pdfBase64:{type:String}, // For storing AI-generated PDF as base64
        isAIGenerated:{type:Boolean, default: false}, // Flag to identify AI-generated templates
        ownerId:{type:String}, // User ID who created the form
        owner:{type:String} // Owner's full name for easy display
    },
    {timestamps: true}
);


module.exports= mongoose.model('Form',FormBuilderSchema);
