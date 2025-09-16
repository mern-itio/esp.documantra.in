const mongoose = require('mongoose');

const FormSubmissionSchema = new mongoose.Schema(
    {
        formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true }, 
        data: { type: Map, of: String }, 
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true}
);
module.exports = mongoose.model('FormSubmission',FormSubmissionSchema)
