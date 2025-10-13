const { servicePost } = require("../utils/apiHelper");

const createPlane = async(req, res) =>{
    try{
        const payload = req.body || {};
        if(!payload || !payload.name || payload.pricePerPeriod === undefined) {
            return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
        } 
        const result = await servicePost(req, 'subscription', {
            url: '/admin/plan-templates',
            data: payload
        });
        if(result.status == 201){
            return res.status(201).json({
                status:201,
                message:'Plan template created successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to create plan template',
                data:result.data || null
            })
        }
    }catch (err){
        console.error('Error creating plan template:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {createPlane};