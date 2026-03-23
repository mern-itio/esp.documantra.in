const { servicePost, serviceGet, servicePut, serviceDel } = require("../utils/apiHelper");
const listCreditPackages = async (req, res) => {
  try {
    const {name, credits, price} = req.query;
        const queryParams = new URLSearchParams();
        if (name) queryParams.append('name', name);
        if (credits) queryParams.append('credits', credits);
        if (price) queryParams.append('search', price);
        const queryString = queryParams.toString();
        const url = queryString ? `/admin/credit-packages?${queryString}` : '/admin/credit-packages';
    
        const result = await serviceGet(req, 'subscription', {
        url: url
        });

    if(result.status == 200){
        return res.status(200).json({
            status: 200,
            message: 'Credit packages retrieved successfully',
            data: result.data
        });
    } else {
        return res.status(result.status).json({
            status: result.status,
            message: result.message || 'Failed to retrieve credit packages',
            data: result.data || null
        });
    }

  } catch (error) {
    console.error('Error fetching credit packages:', error);
    res.status(500).json({ message: 'Failed to fetch credit packages' });
  }
};

const createCreditPackage = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.name || !payload.credits || !payload.price) {
            return res.status(400).json({ message: 'Name, credits, and price are required' });
        }
        const result = await servicePost(req, 'subscription', {
            url: '/admin/credit-packages',
            data: payload
        });
        if (result.status === 201) {
            return res.status(201).json({
                status: 201,
                message: 'Credit package created successfully',
                data: result.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to create credit package',
                data: result.data || null
            });
        }

    } catch (error) {
        console.error('Error creating credit package:', error);
        res.status(500).json({ message: 'Failed to create credit package' });
    }
};

const updateCreditPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        if (!payload.name && !payload.credits && !payload.price) {
            return res.status(400).json({ message: 'At least one field (name, credits, or price) is required to update' });
        }
        const result = await servicePut(req, 'subscription', {
            url: `/admin/credit-packages/${id}`,
            data: payload
        });
        if (result.status === 200) {
            return res.status(200).json({
                status: 200,
                message: 'Credit package updated successfully',
                data: result.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to update credit package',
                data: result.data || null
            });
        }
    }
    catch (error) {
        console.error('Error updating credit package:', error);
        res.status(500).json({ message: 'Failed to update credit package' });
    }
};

const deleteCreditPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceDel(req, 'subscription', {
            url: `/admin/credit-packages/${id}`
        });
        if (result.status === 200) {
            return res.status(200).json({
                status: 200,
                message: 'Credit package deleted successfully',
                data: result.data.data
            });
        } else {
            return res.status(result.status).json({
                status: result.status,
                message: result.message || 'Failed to delete credit package',
                data: result.data || null
            });
        }
    }
    catch (error) {
        console.error('Error deleting credit package:', error);
        return res.status(500).json({ message: 'Failed to delete credit package' });
    }
};

module.exports = {
    listCreditPackages,
    createCreditPackage,
    updateCreditPackage,
    deleteCreditPackage
};