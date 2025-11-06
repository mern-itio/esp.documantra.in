const EnvelopeType = require('../models/EnvelopeType');

// Get all envelope types
const getAllEnvelopeTypes = async (req, res) => {
  try {
    const envelopeTypes = await EnvelopeType.find()
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      status: 'success',
      data: envelopeTypes
    });
  } catch (error) {
    console.error('Error fetching envelope types:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch envelope types'
    });
  }
};

// Get single envelope type by ID
const getEnvelopeTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const envelopeType = await EnvelopeType.findById(id);
    
    if (!envelopeType) {
      return res.status(404).json({
        status: 'error',
        message: 'Envelope type not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: envelopeType
    });
  } catch (error) {
    console.error('Error fetching envelope type:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch envelope type'
    });
  }
};

// Create new envelope type
const createEnvelopeType = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required'
      });
    }
    
    const envelopeType = new EnvelopeType({
      title,
      description: description || '',
      createdBy: userId,
      isActive: true
    });
    
    await envelopeType.save();
    
    return res.status(201).json({
      status: 'success',
      message: 'Envelope type created successfully',
      data: envelopeType
    });
  } catch (error) {
    console.error('Error creating envelope type:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Envelope type with this title already exists'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create envelope type'
    });
  }
};

// Update envelope type
const updateEnvelopeType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.data?.id;
    const { title, description, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedBy = userId;
    
    const envelopeType = await EnvelopeType.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!envelopeType) {
      return res.status(404).json({
        status: 'error',
        message: 'Envelope type not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Envelope type updated successfully',
      data: envelopeType
    });
  } catch (error) {
    console.error('Error updating envelope type:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Envelope type with this title already exists'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update envelope type'
    });
  }
};

// Delete envelope type
const deleteEnvelopeType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const envelopeType = await EnvelopeType.findByIdAndDelete(id);
    
    if (!envelopeType) {
      return res.status(404).json({
        status: 'error',
        message: 'Envelope type not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Envelope type deleted successfully',
      data: envelopeType
    });
  } catch (error) {
    console.error('Error deleting envelope type:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete envelope type'
    });
  }
};

module.exports = {
  getAllEnvelopeTypes,
  getEnvelopeTypeById,
  createEnvelopeType,
  updateEnvelopeType,
  deleteEnvelopeType
};

