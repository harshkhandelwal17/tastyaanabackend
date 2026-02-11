const ChargesAndTaxes = require('../models/ChargesAndTaxes');
const Category = require('../models/Category');

// Get applicable charges for an order
const getApplicableCharges = async (req, res) => {
  try {
    const { items, subtotal, orderDate } = req.body;
    console.log("items are : ", items, "\n\n\n\n\n");
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }
    
    const applicableCharges = await ChargesAndTaxes.getApplicableCharges({
      items,
      subtotal: subtotal || 0,
      orderDate: orderDate ? new Date(orderDate) : new Date()
    });
    console.log("charges are : ",applicableCharges)
    res.json({
      success: true,
      applicableCharges: applicableCharges
    });
  } catch (error) {
    console.error('Error getting applicable charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applicable charges',
      error: error.message
    });
  }
};

// Get all charges and taxes (admin) - now returns documents with arrays of charges
const getAllCharges = async (req, res) => {
  try {
    const { categoryId, isDefault, isActive } = req.query;
    
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (isDefault !== undefined) filter.isDefault = isDefault === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const charges = await ChargesAndTaxes.find(filter)
      .populate('categoryId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ isDefault: 1, categoryName: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    console.error('Error getting charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get charges',
      error: error.message
    });
  }
};

const getCharges = async (req, res) => {
  try {
    const { id } = req.params;
    const charges = await ChargesAndTaxes.findById(id)
      .populate('categoryId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
      // .sort({ isDefault: 1, categoryName: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    console.error('Error getting charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get charges',
      error: error.message
    });
  }
};

// Create new charge document (for a category or default)
const createCharge = async (req, res) => {
  try {
    const chargeData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const charge = new ChargesAndTaxes(chargeData);
    await charge.save();
    
    await charge.populate('categoryId', 'name');
    await charge.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: charge,
      message: 'Charge document created successfully'
    });
  } catch (error) {
    console.error('Error creating charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create charge',
      error: error.message
    });
  }
};

// Update charge document
const updateCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    const charge = await ChargesAndTaxes.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');
    
    if (!charge) {
      return res.status(404).json({
        success: false,
        message: 'Charge document not found'
      });
    }
    
    res.json({
      success: true,
      data: charge,
      message: 'Charge document updated successfully'
    });
  } catch (error) {
    console.error('Error updating charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update charge',
      error: error.message
    });
  }
};

// Delete charge document
const deleteCharge = async (req, res) => {
  try {
    const { id } = req.params;
    
    const charge = await ChargesAndTaxes.findByIdAndDelete(id);
    
    if (!charge) {
      return res.status(404).json({
        success: false,
        message: 'Charge document not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Charge document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete charge',
      error: error.message
    });
  }
};

// Get charge types and categories for form
const getChargeFormData = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('_id name')
      .sort({ name: 1 });
    
    const chargeTypes = [
      { value: 'rain', label: 'Rain Charge' },
      { value: 'packing', label: 'Packing Charge' },
      { value: 'tax', label: 'Tax' },
      { value: 'delivery', label: 'Delivery Charge' },
      { value: 'service', label: 'Service Charge' },
      { value: 'handling', label: 'Handling Charge' },
      { value: 'discount', label: 'Discount' },
      { value: 'other', label: 'Other' }
    ];
    
    const weatherConditions = [
      { value: 'any', label: 'Any Weather' },
      { value: 'rain', label: 'Rain' },
      { value: 'heavy_rain', label: 'Heavy Rain' },
      { value: 'storm', label: 'Storm' }
    ];
    
    res.json({
      success: true,
      data: {
        categories,
        chargeTypes,
        weatherConditions
      }
    });
  } catch (error) {
    console.error('Error getting form data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get form data',
      error: error.message
    });
  }
};

module.exports = {
  getApplicableCharges,
  getAllCharges,
  createCharge,
  updateCharge,
  getCharges,
  deleteCharge,
  getChargeFormData
};
