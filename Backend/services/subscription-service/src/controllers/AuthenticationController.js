const { verify } = require('jsonwebtoken');
const authProviderServices = require('../services/authProviderServices');
const axios = require('axios');
const initiateAuth = async (req, res) => {
  try {
    const { providerId, recipientData, envelopeId } = req.body;
    console.log("Envelope ID:", envelopeId);
    if (!providerId || !recipientData) {
      return res.status(400).json({
        message: "Missing providerId or recipientData"
      });
    }

    const provider = await authProviderServices.getProviderById(providerId);

    if (!provider) {
      return res.status(404).json({
        message: "Auth provider not found"
      });
    }

    const type = provider.config.providerType;

    switch (type) {

      case "email_otp":

        if (!recipientData.email) {
          return res.status(400).json({
            message: "Missing email in Recipient Data",
            errorCode: "MISSING_INFO",
            missingRequirement: "email"
          });
        }

        const emailResponse = await authProviderServices.initiateEmailOtpVerification(providerId, recipientData);
        console.log("Email OTP initiation response:", emailResponse);
        return res.status(200).json({
          status: "pending",
          message: `OTP has been sent to your registered email (${recipientData.email} )`,
          action: "ENTER_OTP",
          verificationId: emailResponse.verificationId,
          metadata: {
            otpLength: emailResponse.otpLength
          }
        });

      case "sms_otp":
        if (!recipientData.mobile && !recipientData.phone && !recipientData.phoneNumber) {
          return res.status(400).json({
            message: "Missing mobile number in Recipient Data",
            errorCode: "MISSING_INFO",
            missingRequirement: "mobile"
          });
        }
        const phoneResponse = await authProviderServices.initiateSmsOtpVerification(providerId, recipientData);
          if(!phoneResponse.success){
            return res.status(500).json({
              message: phoneResponse.error || "Failed to initiate SMS OTP verification"
            });
          }
          return res.status(200).json({
            status: "pending",
            message: phoneResponse.message,
            action: "ENTER_OTP",
            verificationId: phoneResponse.verificationId,
            metadata: {
              otpLength: phoneResponse.otpLength
            }
          });

        case "didit":
         const extraFields = provider?.config?.extraFields;
         const workFLowId = extraFields?.get("DIDIT_WORKFLOW_ID");
         const webhookUrl = provider?.config?.callbackUrl;
         const verificationUrl = extraFields?.get("Verification_URL");
         const diditResponse = await axios.post(process.env.IDENTITY_SERVICE_URL + '/api/identity/start', {
          userId: recipientData.id,
          authProviderId: providerId,
          verificationUrl: verificationUrl,
          workFLowId: workFLowId,
          webhookUrl: webhookUrl,
          apiKey: provider.config.apiKeyRef,
          envelopeId: envelopeId
          });
          if(diditResponse.data.success){
            return res.status(200).json({
              status: "pending",
              message: "Identity verification initiated. Please complete the verification process using the provided URL.",
              action: "COMPLETE_IDENTITY_VERIFICATION",
              verificationUrl: diditResponse.data.url
            });
          }else{
            return res.status(500).json({
              message: "Failed to initiate identity verification"
            });
          }

        case "selfie_capture": {
          const selfieResponse = await authProviderServices.initiateSelfieVerification(providerId, recipientData);
          if (!selfieResponse.success) {
            return res.status(500).json({
              message: selfieResponse.error || 'Failed to initiate selfie verification',
            });
          }
          return res.status(200).json({
            status: 'pending',
            message: selfieResponse.message,
            action: 'CAPTURE_SELFIE',
            verificationId: selfieResponse.verificationId,
            metadata: {
              captureMode: 'camera',
              maxAttempts: provider?.constraints?.maxAttempts || 3,
            },
          });
        }

        case "liveness_check": {
          const livenessResponse = await authProviderServices.initiateLivenessVerification(providerId, recipientData);
          if (!livenessResponse.success) {
            return res.status(500).json({
              message: livenessResponse.error || 'Failed to initiate liveness verification',
            });
          }
          return res.status(200).json({
            status: 'pending',
            message: livenessResponse.message,
            action: 'CAPTURE_LIVENESS',
            verificationId: livenessResponse.verificationId,
            metadata: {
              steps: ['center', 'turn_left'],
              maxAttempts: provider?.constraints?.maxAttempts || 3,
            },
          });
        }

        // Other Cases like sms, totp etc can be handled here in future
      default:
        return res.status(400).json({
          message: `Unsupported auth provider type: ${type}`
        });
    }

  } catch (err) {
    console.error("Auth initiation failed:", err);

    return res.status(500).json({
      message: "Authentication initiation failed",
      error: err.message
    });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { providerId, recipientId, otp, verificationId, envelopeId } = req.body;
    if (!providerId || !recipientId || !otp || !verificationId || !envelopeId) {
      return res.status(400).json({
        message: "Missing required fields: providerId, recipientId, otp, verificationId, or envelopeId"
      });
    }
    const verificationResult = await authProviderServices.verifyOtp(providerId, recipientId, otp, verificationId);
    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.message
      });
    }
    // Update recipient record
    try{
      await axios.post(process.env.ESING_SERVICE_URL + '/api/e-sign/public/recipients/update-verification-status', {
        recipientId: recipientId,
        providerId: providerId,
        envelopeId: envelopeId,
        verificationStatus: 'completed'
      });

    }catch (err){
      console.error("Failed to update recipient record after OTP verification:", err);
    }
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (err) {
    console.error("OTP verification failed:", err);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: err.message
    });
  }
};


const verifySelfie = async (req, res) => {
  try {
    const { providerId, recipientId, verificationId, envelopeId, imageBase64, faceBox } = req.body;

    if (!providerId || !recipientId || !verificationId || !envelopeId || !imageBase64) {
      return res.status(400).json({
        message: 'Missing required fields: providerId, recipientId, verificationId, envelopeId, or imageBase64',
      });
    }

    const provider = await authProviderServices.getProviderById(providerId);
    const maxAttempts = provider?.constraints?.maxAttempts || 3;

    const sessionCheck = await authProviderServices.verifyBiometricSession(
      providerId,
      recipientId,
      verificationId,
      'selfie'
    );
    if (!sessionCheck.success) {
      return res.status(400).json({
        success: false,
        message: sessionCheck.message,
      });
    }

    const identityBase = (process.env.IDENTITY_SERVICE_URL || '').replace(/\/+$/, '');
    if (!identityBase) {
      return res.status(500).json({
        success: false,
        message: 'Identity service is not configured',
      });
    }

    let storeResponse;
    try {
      storeResponse = await axios.post(`${identityBase}/api/identity/selfie/store`, {
        userId: recipientId,
        authProviderId: providerId,
        envelopeId,
        verificationId,
        imageBase64,
        faceBox,
      });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data?.validationFailed) {
        const failure = await authProviderServices.recordBiometricFailure(verificationId, maxAttempts);
        return res.status(400).json({
          success: false,
          message: data.message || failure.message,
          validationFailed: true,
          attemptsRemaining: failure.attemptsRemaining,
          maxAttemptsReached: failure.maxAttemptsReached || false,
        });
      }
      throw err;
    }

    if (!storeResponse.data?.success) {
      const failure = await authProviderServices.recordBiometricFailure(verificationId, maxAttempts);
      return res.status(400).json({
        success: false,
        message: storeResponse.data?.message || failure.message,
        validationFailed: true,
        attemptsRemaining: failure.attemptsRemaining,
        maxAttemptsReached: failure.maxAttemptsReached || false,
      });
    }

    try {
      await axios.post(process.env.ESING_SERVICE_URL + '/api/e-sign/public/recipients/update-verification-status', {
        recipientId,
        providerId,
        envelopeId,
        verificationStatus: 'completed',
      });
    } catch (err) {
      console.error('Failed to update recipient record after selfie verification:', err);
      return res.status(500).json({
        success: false,
        message: 'Selfie stored but failed to update signing status',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Selfie verified successfully',
      data: storeResponse.data?.data || null,
    });
  } catch (err) {
    console.error('Selfie verification failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Selfie verification failed',
      error: err.message,
    });
  }
};

const verifyLiveness = async (req, res) => {
  try {
    const {
      providerId,
      recipientId,
      verificationId,
      envelopeId,
      imageBase64,
      secondaryImageBase64,
      faceBox,
      secondaryFaceBox,
    } = req.body;

    if (!providerId || !recipientId || !verificationId || !envelopeId || !imageBase64 || !secondaryImageBase64) {
      return res.status(400).json({
        message:
          'Missing required fields: providerId, recipientId, verificationId, envelopeId, imageBase64, or secondaryImageBase64',
      });
    }

    const provider = await authProviderServices.getProviderById(providerId);
    const maxAttempts = provider?.constraints?.maxAttempts || 3;

    const sessionCheck = await authProviderServices.verifyBiometricSession(
      providerId,
      recipientId,
      verificationId,
      'liveness'
    );
    if (!sessionCheck.success) {
      return res.status(400).json({
        success: false,
        message: sessionCheck.message,
      });
    }

    const identityBase = (process.env.IDENTITY_SERVICE_URL || '').replace(/\/+$/, '');
    if (!identityBase) {
      return res.status(500).json({
        success: false,
        message: 'Identity service is not configured',
      });
    }

    let storeResponse;
    try {
      storeResponse = await axios.post(`${identityBase}/api/identity/liveness/store`, {
        userId: recipientId,
        authProviderId: providerId,
        envelopeId,
        verificationId,
        imageBase64,
        secondaryImageBase64,
        faceBox,
        secondaryFaceBox,
      });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data?.validationFailed) {
        const failure = await authProviderServices.recordBiometricFailure(verificationId, maxAttempts);
        return res.status(400).json({
          success: false,
          message: data.message || failure.message,
          validationFailed: true,
          attemptsRemaining: failure.attemptsRemaining,
          maxAttemptsReached: failure.maxAttemptsReached || false,
        });
      }
      throw err;
    }

    if (!storeResponse.data?.success) {
      const failure = await authProviderServices.recordBiometricFailure(verificationId, maxAttempts);
      return res.status(400).json({
        success: false,
        message: storeResponse.data?.message || failure.message,
        validationFailed: true,
        attemptsRemaining: failure.attemptsRemaining,
        maxAttemptsReached: failure.maxAttemptsReached || false,
      });
    }

    try {
      await axios.post(process.env.ESING_SERVICE_URL + '/api/e-sign/public/recipients/update-verification-status', {
        recipientId,
        providerId,
        envelopeId,
        verificationStatus: 'completed',
      });
    } catch (err) {
      console.error('Failed to update recipient record after liveness verification:', err);
      return res.status(500).json({
        success: false,
        message: 'Liveness stored but failed to update signing status',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Liveness verified successfully',
      data: storeResponse.data?.data || null,
    });
  } catch (err) {
    console.error('Liveness verification failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Liveness verification failed',
      error: err.message,
    });
  }
};

module.exports = {initiateAuth, verifyOtp, verifySelfie, verifyLiveness };