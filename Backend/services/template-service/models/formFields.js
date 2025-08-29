const mongoose = require('mongoose');


const FormFieldSchema = new mongoose.Schema(
    {
        formId: {type: mongoose.Schema.Types.ObjectId, ref:"Form", index: true},
        type: {type:String, required: true},
        label: {type: String, required: true},
        placeholder:{type: String},
        required:{type:Boolean, default: false},
        options: {type:[String]},
        order: {type:Number, required: true}
    },
    { timestamps: true}
);
module.exports = mongoose.model('FormFields',FormFieldSchema)