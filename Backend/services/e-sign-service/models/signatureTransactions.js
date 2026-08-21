const mongoose = require("mongoose");
const signatureTransactions = new mongoose.Schema({
    txn:{type:String,required:true,unique:true},
    txnRef:{type:String,required:true},
    documentId:{type:mongoose.Schema.Types.ObjectId,ref:"Document",required:true},
    recipientId:{type:mongoose.Schema.Types.ObjectId,ref:"Recipient",required:true},
    fieldId:{type:mongoose.Schema.Types.ObjectId,ref:"SignatureField",required:true},
    envelopeId:{type:mongoose.Schema.Types.ObjectId,ref:"Envelope",required:true},
    signedFilePath:{type:String,required:true},
    signatureImage:{type:String},
    signBase64:{type:String},
    appearanceWidth:{type:Number},
    appearanceHeight:{type:Number},
    signatureFontSize:{type:String},
    tickImgPath:{type:String},
    aspLogo:{type:String},
    appearanceBoxes:{ type: Array, default: undefined },
    aadhaarLast4:{ type: String },
    aadhaarSignerName:{ type: String },
});
module.exports = mongoose.model("SignatureTransaction", signatureTransactions);