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

const initiateSelfieVerification = async (providerId, recipientData) => {
    const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    const verificationCode = new VerificationCode({
        authenticationProviderId: providerId,
        type: 'selfie',
        verificationData: sessionToken,
        recipientId: recipientData.id,
        expiryTime,
    });
    await verificationCode.save();

    return {
        success: true,
        message: 'Capture your selfie to continue.',
        verificationId: verificationCode._id,
    };
};

const initiateLivenessVerification = async (providerId, recipientData) => {
    const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    const verificationCode = new VerificationCode({
        authenticationProviderId: providerId,
        type: 'liveness',
        verificationData: sessionToken,
        recipientId: recipientData.id,
        expiryTime,
    });
    await verificationCode.save();

    return {
        success: true,
        message: 'Complete the liveness check to continue.',
        verificationId: verificationCode._id,
    };
};

const verifyBiometricSession = async (providerId, recipientId, verificationId, sessionType) => {
    const record = await VerificationCode.findOne({
        _id: verificationId,
        authenticationProviderId: providerId,
        recipientId: recipientId,
        type: sessionType,
        expiryTime: { $gt: new Date() },
    });

    if (!record) {
        return { success: false, message: 'Invalid or expired verification session' };
    }

    return {
        success: true,
        message: 'Verification session is valid',
        sessionToken: record.verificationData,
        attempts: record.attempts || 0,
        record,
    };
};

const recordBiometricFailure = async (verificationId, maxAttempts = 3) => {
    const record = await VerificationCode.findByIdAndUpdate(
        verificationId,
        { $inc: { attempts: 1 } },
        { new: true }
    );

    if (!record) {
        return { success: false, message: 'Invalid verification session' };
    }

    if ((record.attempts || 0) >= maxAttempts) {
        return {
            success: false,
            message: 'Maximum verification attempts reached. This method cannot be used further.',
            maxAttemptsReached: true,
            attempts: record.attempts,
        };
    }

    return {
        success: false,
        message: 'Verification failed',
        attempts: record.attempts,
        attemptsRemaining: Math.max(0, maxAttempts - record.attempts),
    };
};

const verifySelfieSession = async (providerId, recipientId, verificationId) =>
    verifyBiometricSession(providerId, recipientId, verificationId, 'selfie');


module.exports = {
    initiateSmsOtpVerification,
    getProviderById,
    initiateEmailOtpVerification,
    verifyOtp,
    initiateSelfieVerification,
    initiateLivenessVerification,
    verifySelfieSession,
    verifyBiometricSession,
    recordBiometricFailure,
};