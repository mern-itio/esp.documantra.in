const Recipient = require("../models/Recipient");
const axios = require("axios");
async function fetchRecipientById(recipientId){
    const result = await Recipient.findById(recipientId);
    return result;
}
async function fetchUserByEmail(email) {
    try{
        const response = await axios.get(`${process.env.AUTH_URL}/api/find-user/${email}`);
        return response?.data?.data;
    }catch (err){
        console.log(err);
    }
}
async function updateRecipient(recipientId, data) {
  try {
    if (!recipientId) {
      throw new Error("Recipient ID is required");
    }

    const updatedRecipient = await Recipient.findByIdAndUpdate(
      recipientId,
      { $set: data },
      { new: true } // return updated doc
    );

    if (!updatedRecipient) {
      throw new Error(`Recipient not found for ID: ${recipientId}`);
    }

    return updatedRecipient;

  } catch (err) {
    console.error("updateRecipient error:", err.message);
    throw err;
  }
}
module.exports ={
    fetchRecipientById,
    fetchUserByEmail,
    updateRecipient
}