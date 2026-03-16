const axios = require('axios');
const sms = async (phoneNumber,otp,apiKey,apiToken)=>{
    console.log("Preparing to send SMS OTP", { phoneNumber, otp });
    console.log("API Key:", apiKey);
    console.log("API Token:", apiToken);
    const payload = {
    messages: [
      {
        channel: "sms",
        originator: "D7-RapidAPI",
        recipients: [phoneNumber],
        content: otp,
        data_coding: "text"
      }
    ]
  };

  try {
    const response = await axios.post(
      "https://d7sms.p.rapidapi.com/messages/v1/send",
      payload,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "d7sms.p.rapidapi.com",
          "Content-Type": "application/json",
          "Token": apiToken
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("SMS sending error:", err.response?.data || err.message);
    throw err;
  }
}
module.exports = {
    sms
}