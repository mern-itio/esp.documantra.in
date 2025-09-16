const speakeasy = require("speakeasy");
const crypto = require("crypto");
const { OtpLog } = require("../models/OtpLog");
const { AuditTrail } = require("../models/AuditTrail");

async function generateOtp(recipientId, envelopeId) {
  const otpCode = speakeasy.totp({ secret: process.env.OTP_SECRET || "supersecret", digits: 6 });
  const otpTxnId = crypto.randomBytes(8).toString("hex");

  const log = await OtpLog.create({
    recipientId,
    envelopeId,
    otpTxnId,
    otpCode: crypto.createHash("sha256").update(otpCode).digest("hex"),
    status: "pending"
  });

  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: "OTP_SENT",
    details: { otpTxnId }
  });

  // ⚠️ In production, do NOT return otpCode — only send via SMS/Email
  return { otpTxnId, otpCode };
}

async function verifyOtp(otpTxnId, otpInput, recipientId, envelopeId) {
  const hashedInput = crypto.createHash("sha256").update(otpInput).digest("hex");
  const log = await OtpLog.findOne({ otpTxnId, recipientId, envelopeId });

  if (!log || log.otpCode !== hashedInput) {
    if (log) {
      log.status = "failed";
      await log.save();
    }
    throw new Error("Invalid OTP");
  }

  log.status = "verified";
  log.verifiedAt = new Date();
  await log.save();

  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: "OTP_VERIFIED",
    details: { otpTxnId }
  });

  return true;
}

module.exports = { generateOtp, verifyOtp };
