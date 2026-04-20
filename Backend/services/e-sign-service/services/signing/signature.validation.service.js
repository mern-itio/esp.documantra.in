const { fetchUserByEmail,fetchRecipientById,updateRecipient } = require("../recipientService");

module.exports = {
    aadhaarSignature: async (data) => {
     const {recipientId} = data;
     const recipient = await fetchRecipientById(recipientId);
     if(!recipient){
        throw new Error(`Recipient not found for ID: ${recipientId}`);
     }
     // Step 2: If already has aadhaar → done
     if(recipient?.aadhaarNumber){
        return {
         flag: true,
         method: "aadhaarSignature"
        }
     }
     // Step 3: Check authUserId
     if(!recipient?.authUserId){
        return {
         flag: false,
         method: "aadhaarSignature"
        }
     }
     // Step 4: Fetch user
     const user = await fetchUserByEmail(recipient?.email );
     console.log(user);
     if (!user) return { flag: false, method: "aadhaarSignature" };
     if(user.aadhaarNumber){
        const updateData  =  {
             aadhaarNumber: user.aadhaarNumber
            }
        const updated  = await updateRecipient(recipientId, updateData);
         return {
            flag: !!updated,
            method: "aadhaarSignature"
           }
         }
      return {
       flag: false,
       method: "aadhaarSignature"
      };
    }
}