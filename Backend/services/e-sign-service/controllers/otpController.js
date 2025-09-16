const { generateOtp, verifyOtp } = require("../services/otpService");

async function sendOtpController(req, res) {
  try {
    const { recipientId, envelopeId } = req.body;
    const { otpTxnId, otpCode } = await generateOtp(recipientId, envelopeId);

    // ⚠️ Only for testing — remove otpCode in production
    res.json({ success: true, otpTxnId, otpCode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function verifyOtpController(req, res) {
  try {
    const { otpTxnId, otpInput, recipientId, envelopeId } = req.body;
    await verifyOtp(otpTxnId, otpInput, recipientId, envelopeId);

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { sendOtpController, verifyOtpController };
