const mongoose = require('mongoose');


const EmailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    template_Slug:{
      type:String,
      enum:[
        'Signup',
        'login',
        'newDeviceLogin',
        'envSignRequest',
        'envSignReject',
        'envSignComplete',
        'authOTP',
        'envReminder',
        'test'
      ],
      required:true
    },
    design: {
      type: Object,
      required: true
    },

    html: {
      type: String,
      required: true
    },

    variables: {
      type: [String],
      default: []
    },

    category: {
      type: String,
      default: 'general'
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    isApproved:{type:Boolean, default:true},
    isAdmin:{type:Boolean, default:false},
    isUser:{type:Boolean, default:false},
    createdBy: {
     type: mongoose.Schema.Types.ObjectId
    }

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Template', EmailTemplateSchema);
