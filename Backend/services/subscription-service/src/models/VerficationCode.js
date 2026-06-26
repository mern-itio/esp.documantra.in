const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    authenticationProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthProvider', required: true },
    type: { type: String, enum:['otp','link','selfie'], required: true },
    verificationData: { type: String, required: true },// e.g. OTP code or unique link token
    otpLength: { type: Number }, // applicable if type is OTP
    recipientId: { type: String, required: true },
    expiryTime: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
});

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);