const express = require("express");
const { sendOtpController, verifyOtpController } = require("../controllers/otpController");

const router = express.Router();

router.post("/otp/send", sendOtpController);
router.post("/otp/verify", verifyOtpController);

module.exports = router;
