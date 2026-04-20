require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});
const connectDB = require("../config/db");
const axios = require("axios");

// adjust based on your setup
const Recipient = require("../models/Recipient");

async function seedAuthUserId() {
  try {
    await connectDB();
    console.log("DB connected");

    const token = process.env.SEED_AUTH_TOKEN; // put a valid token in .env

    // Step 1: Get recipients without authUserId
    const recipients = await Recipient.find({
      email: { $exists: true, $ne: null },
      $or: [
        { authUserId: { $exists: false } },
        { authUserId: null }
      ]
    });

    console.log(`Found ${recipients.length} recipients`);

    let updated = 0;
    let notFound = 0;

    for (const r of recipients) {
      try {
        if (!r.email) continue;

        // Step 2: Call auth API
        const response = await axios.get(
          `${process.env.AUTH_URL}/api/find-user/${r.email}`);

        const user = response?.data?.data;

        if (!user) {
          notFound++;
          continue;
        }

        // Step 3: Update recipient
        r.authUserId = user._id;

        await r.save();
        updated++;

        console.log(`Updated: ${r.email}`);

      } catch (err) {
        console.error(`Error for ${r.email}:`, err?.response?.data || err.message);
      }
    }

    console.log("------ RESULT ------");
    console.log("Updated:", updated);
    console.log("User Not Found:", notFound);

    process.exit(0);

  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seedAuthUserId();