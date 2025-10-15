const { servicePost, serviceGet, servicePut, serviceDel } = require("../utils/apiHelper");

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
        console.log(result);
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

const getPlan = async(req, res) => {
    try{
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
        }

        const result = await serviceGet(req, 'subscription', {
            url: `/admin/plan-templates/${id}`
        });

        if(result.status == 200){
            return res.status(200).json({
                status: 200,
                message: 'Plan retrieved successfully',
                data: result.data.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to retrieve plan',
                data: result.data || null
            });
        }
    } catch (err) {
        console.error('Error retrieving plan:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const listPlans = async(req, res) => {
    try{
        const { page, limit, period, search } = req.query;
        
        // Build query string
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (period) queryParams.append('period', period);
        if (search) queryParams.append('search', search);
        
        const queryString = queryParams.toString();
        const url = queryString ? `/admin/plan-templates?${queryString}` : '/admin/plan-templates';

        const result = await serviceGet(req, 'subscription', {
            url: url
        });

        if(result.status == 200){
            return res.status(200).json({
                status: 200,
                message: 'Plans retrieved successfully',
                data: result.data.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to retrieve plans',
                data: result.data || null
            });
        }
    } catch (err) {
        console.error('Error retrieving plans:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const updatePlan = async(req, res) => {
    try{
        const { id } = req.params;
        const payload = req.body || {};
        
        if (!id) {
            return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
        }

        const result = await servicePut(req, 'subscription', {
            url: `/admin/plan-templates/${id}`,
            data: payload
        });

        if(result.status == 200){
            return res.status(200).json({
                status: 200,
                message: 'Plan updated successfully',
                data: result.data.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to update plan',
                data: result.data || null
            });
        }
    } catch (err) {
        console.error('Error updating plan:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const deletePlan = async(req, res) => {
    try{
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
        }

        const result = await serviceDel(req, 'subscription', {
            url: `/admin/plan-templates/${id}`
        });

        if(result.status == 200){
            return res.status(200).json({
                status: 200,
                message: 'Plan deleted successfully',
                data: result.data.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to delete plan',
                data: result.data || null
            });
        }
    } catch (err) {
        console.error('Error deleting plan:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {createPlane, getPlan, listPlans, updatePlan, deletePlan};