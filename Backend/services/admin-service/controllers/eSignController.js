const { serviceGet, servicePatch } = require('../utils/apiHelper');

const getEnvelopes = async(req, res) => {
const filterUserId = req.query.userId; // <-- new query param
  try {
    let url = "/admin/fetch/envelopes";
    if (filterUserId) {
          url += `?userId=${filterUserId}`;
        }
    const result = await serviceGet(req, 'esign', {
                            url: url
    });
        if(result.status ==200){
      return res.status(200).json({
                status:200,
                message:'Envelope fetched successfully',
                data:result.data.data
            })
        }else{
            return res.status(404).json({
                status:404,
                message:'Envelope not found.'
            })
    }
    }catch (err){
        console.log(err);
        return res.status(500).json({status: 500, message: 'Internal Server Error', data: null});
  }
}

module.exports = {getEnvelopes};