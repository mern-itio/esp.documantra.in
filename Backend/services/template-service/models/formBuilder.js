//models/formBuilder.js
const mongoose = require('mongoose');

const FormBuilderSchema = new mongoose.Schema(
    {
        title:{type:String, required: true},
        description:{type:String},
        content:{type:String}, // For storing AI-generated document content (plain text)
        pdfBase64:{type:String}, // For storing AI-generated PDF as base64
        isAIGenerated:{type:Boolean, default: false}, // Flag to identify AI-generated templates
        createdByAdmin:{type:Boolean, default:false}, // True when generated/published by admin for global library
        templateType:{type:String}, // Template type/category from AI generation flow
        approvalStatus:{type:String, enum:['pending','approved','rejected'], default:'pending'},
        isActive:{type:Boolean, default:true}, // Admin-controlled publish toggle for user visibility
        approvedBy:{type:String},
        approvedAt:{type:Date},
        rejectionReason:{type:String},
        ownerId:{type:String}, // User ID who created the form
        owner:{type:String} // Owner's full name for easy display
    },
    {timestamps: true}
);


module.exports= mongoose.model('Form',FormBuilderSchema);
