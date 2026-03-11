const authProviderServices = require('../services/authProviderServices');
const callback = async (req, res) => {
    const {type} = req.params;
    const {id, phoneNumber} = req.query;

    switch(type){
        case 'sms':
            console.log(`Received callback for SMS with id: ${id} and phone number: ${phoneNumber}`);
            if(!id || !phoneNumber){
                return res.status(400).json({message:'Missing id or phone number in query parameters'});
            }
            const response = authProviderServices.sms(id, phoneNumber);
            if(response.error){
                return res.status(500).json({message:'Error processing SMS callback', error: response.error});
            }
            if(response.success){
                console.log(`Successfully processed SMS callback for id: ${id}`);
            }
            break;
        default:
            console.log(`Received callback for unknown type: ${type}`);
    }

    return res.status(200).json({message:'Callback received'});
}

module.exports = {callback };