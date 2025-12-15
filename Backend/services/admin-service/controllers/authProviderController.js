const { servicePost, serviceGet, serviceDel, servicePut } = require("../utils/apiHelper");
const addAuthProvider = async (req, res) => {
    const payload = req.body || {};
    if(!payload || !payload.name ) {
        return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
    }
    try{
        const result = await servicePost(req, 'subscription', {
            url: '/admin/auth-providers',
            data: payload
        });
        // console.log(result);
        if(result.status == 201){
            return res.status(201).json({
                status:201,
                message:'Auth provider added successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to add auth provider',
                data:result.data || null
            })
        }

    }catch(error){
        console.error('Error adding auth provider:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
};
const listAuthProviders = async (req, res) => {
    try{
        const result = await serviceGet(req, 'subscription',{
            url: '/admin/auth-providers'
        });
        if(result.status == 200){
            return res.status(200).json({
                status:200,
                message:'Auth provi ders fetched successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to fetch auth providers',
                data:result.data || null
            })
        }
    }catch(error){
        console.error('Error fetching auth providers:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
}
const updateAuthProvider = async (req, res) => {
    const providerId = req.params.id;
    const payload = req.body || {};
    if(!providerId || !payload || !payload.name ) {
        return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
    }
    try{
        const result = await servicePut(req, 'subscription',{
            url: `/admin/auth-providers/${providerId}`,
            data: payload
        });
        if(result.status == 200){
            return res.status(200).json({
                status:200,
                message:'Auth provider updated successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to update auth provider',
                data:result.data || null
            })
        }
    }catch(error){
        console.error('Error updating auth provider:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
}
const toggleAuthProvider = async (req, res) => {
    const {id, enabled} = req.body || {};
    if(!id || typeof enabled !== 'boolean'){
        return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
    }
    try{
        const result = await servicePost(req, 'subscription',{
            url: `/admin/auth-providers/toggle`,
            data: {id, enabled}
        });
        if(result.status == 200){
            return res.status(200).json({
                status:200,
                message:'Auth provider toggled successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to toggle auth provider',
                data:result.data || null
            })
        }   
    }catch(error){
        console.error('Error toggling auth provider:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
}
const deleteAuthProvider = async (req, res) => {
    try{
        const providerId = req.params.id;
        if(!providerId){
            return res.status(400).json({ status: 400, message: 'Missing provider ID', data: null });
        }
        const result = await serviceDel(req, 'subscription',{
            url: `/admin/auth-providers/${providerId}`
        });
        if(result.status == 200){
            return res.status(200).json({
                status:200,
                message:'Auth provider deleted successfully',
                data:result.data.data
            })
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Failed to delete auth provider',
                data:result.data || null
            })
        }
    }catch(error){
        console.error('Error deleting auth provider:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
}
module.exports = {addAuthProvider, listAuthProviders, updateAuthProvider, toggleAuthProvider, deleteAuthProvider};