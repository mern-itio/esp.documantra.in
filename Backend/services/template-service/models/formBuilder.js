//models/formBuilder.js
const mongoose = require('mongoose');

const FormBuilderSchema = new mongoose.Schema(
    {
        title:{type:String, required: true},
        description:{type:String},
        ownerId:{type:String}, // User ID who created the form
        owner:{type:String} // Owner's full name for easy display
    },
    {timestamps: true}
);


module.exports= mongoose.model('Form',FormBuilderSchema);
