const mongoose = require('mongoose');


const templateSchema = new mongoose.Schema(
    {
        title:{type:String, required: true},
        elements:{  type: Array,
                    required: true,
                    default: []
                },
        status:{type: String, enum: ["draft", "active", "published"], default: "draft" },
    },
    { timestamps: true}
);
module.exports = mongoose.model('template',templateSchema)