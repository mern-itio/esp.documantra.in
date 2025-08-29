//models/formBuilder.js
const mongoose = require('mongoose');

const FormBuilderSchema = new mongoose.Schema(
    {
        title:{type:String, required: true},
        description:{type:String}
    },
    {timestamps: true}
);


module.exports= mongoose.model('Form',FormBuilderSchema);
