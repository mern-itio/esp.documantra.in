const authProvider = require('../models/AuthProvider');
const VerificationCode = require('../models/VerficationCode');
const {otpTemplate} = require('../../emails/otpTemplate');
const {sms} = require('./sendSmsService');
const axios = require('axios');

const getProviderById = async (providerId) => {
    const response  = authProvider.findById(providerId);
    return response;
}
const initiateEmailOtpVerification = async (providerId, recipientData) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const verificationCode = new VerificationCode({
        authenticationProviderId: providerId,
        type: 'otp',
        verificationData: otp,
        otpLength: otp.toString().length,
        recipientId: recipientData.id,
        expiryTime: expiryTime
    });
    await verificationCode.save();
    const insertedId = verificationCode._id;
    console.log("Inserted Id:", insertedId);
    const otpEmailHtml = otpTemplate(recipientData.name, otp);
    const response = await axios.post(process.env.EMAIL_SERVICE_URL + '/mail/send-by-system',
        {
            to: recipientData.email,
            subject: 'Your OTP Code for Email Verification',
            html: otpEmailHtml
        }
    );
    if(!response.data.success){
        return {success: false, error: 'Failed to send OTP email' };
    }
    return { success: true, message: 'Email OTP sent successfully',otpLength: otp.toString().length, verificationId: insertedId };
}
const initiateSmsOtpVerification = async (providerId, recipientData) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const verificationCode = new VerificationCode({
        authenticationProviderId: providerId,
        type: 'otp',
        verificationData: otp,
        otpLength: otp.toString().length,
        recipientId: recipientData.id,
        expiryTime: expiryTime
    });
    await verificationCode.save();
    const insertedId = verificationCode._id;
    const authProviderDetails = await getProviderById(providerId);
    if(!authProviderDetails){
        return {success: false, error: 'Authentication provider not found' };
    }
    const apiKey = authProviderDetails?.config?.apiKeyRef;
    const extraFields = authProviderDetails?.config?.extraFields;
    const apiToken = extraFields?.get("api_token");
    const phoneNumber = recipientData.phone ;          
    try{
        const smsResponse = await sms(phoneNumber, otp, apiKey, apiToken);
        if (smsResponse.status !== 'accepted') {
            return { success: false, error: 'Failed to send OTP SMS' };
        }

        return {
            success: true,
            message: 'OTP has been sent to your registered mobile number ' + phoneNumber,
            otpLength: otp.toString().length,
            verificationId: insertedId
        };
    }
    catch(err){
        console.error("Error sending SMS OTP:", err);
        return {success: false, error: 'Failed to send OTP SMS' };
    }

}
const verifyOtp = async (providerId, recipientId, otp, verificationId) => {
    const record = await VerificationCode.findOne({
        _id: verificationId,
        authenticationProviderId: providerId,
        recipientId: recipientId,
        type: 'otp',
        expiryTime: { $gt: new Date() }
    });
    if (!record) {
        return { success: false, message: 'Invalid or expired verification ID' };
    }
    if (record.verificationData !== otp) {
        return { success: false, message: 'Invalid OTP' };
    }
    return { success: true, message: 'OTP verified successfully' };

}


module.exports = { initiateSmsOtpVerification, getProviderById, initiateEmailOtpVerification, verifyOtp };