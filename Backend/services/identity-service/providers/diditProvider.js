const axios = require("axios");
const https = require("https");

exports.createSession = async (userId) => {
  try {
    const res = await axios.post(
      "https://verification.didit.me/v3/session",
      {
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        vendor_data: userId,
        callback: process.env.DIDIT_WEBHOOK_URL,
        metadata: { userId }
      },
      {
        headers: {
          "x-api-key": process.env.DIDIT_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 10000,
        httpsAgent: new https.Agent({ keepAlive: false })
      }
    );

    console.log("SUCCESS:", res.data);
    return res.data;

  } catch (err) {
    console.log("ERROR STATUS:", err.response?.status);
    console.log("ERROR DATA:", err.response?.data);
    console.log("RAW ERROR:", err.message);
    throw err;
  }
};