const mongoose = require('mongoose');

const singleChargeSchema = new mongoose.Schema({
  chargeType: {
    type: String,
    enum: ['rain', 'packing', 'tax', 'delivery', 'service', 'handling', 'discount', 'other'],
    required: true
  },
  calculationType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxOrderAmount: {
    type: Number,
    default: null
  },
  weatherCondition: {
    type: String,
    enum: ['rain', 'heavy_rain', 'storm', 'any'],
    default: 'any'
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: 500
  }
}, { _id: false });

const chargesAndTaxesSchema = new mongoose.Schema({
  // Link to category OR default
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false // null → default/global
  },
  categoryName: {
    type: String
  },

  // Is this a default/global rule?
  isDefault: {
    type: Boolean,
    default: false
  },

  // All charges for this category
  charges: [singleChargeSchema],

  // Admin metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
chargesAndTaxesSchema.index({ categoryId: 1, isActive: 1 });
chargesAndTaxesSchema.index({ isDefault: 1, isActive: 1 });

// Static method to get applicable charges for an order
chargesAndTaxesSchema.statics.getApplicableCharges = async function(orderData) {
  const { items, subtotal, orderDate = new Date() } = orderData;
  
  // Get all unique category IDs from items
  const uniqueCategoryIds = [...new Set(items.map(item => item.category._id).filter(Boolean))];
  
  // Check if cart has multiple categories
  const hasMultipleCategories = uniqueCategoryIds.length > 1;
  
  let applicableCharges = [];
  
  if (hasMultipleCategories) {
    // If multiple categories, use only default charges
    const defaultChargeDoc = await this.findOne({
      isActive: true,
      isDefault: true
    });
    
    if (defaultChargeDoc) {
      const allCharges = defaultChargeDoc.charges.map(charge => ({
        ...charge.toObject(),
        calculatedAmount: calculateChargeAmount(charge, subtotal)
      }));
      
      // Filter out duplicate charges of the same type, keeping only the highest priority one
      applicableCharges = filterDuplicateCharges(allCharges);
    }
  } else {
    // Single category - get category-specific charges + default charges
    const categoryChargeDoc = await this.findOne({
      isActive: true,
      isDefault: false,
      categoryId: { $in: uniqueCategoryIds }
    }).populate('categoryId', 'name');
    
    const defaultChargeDoc = await this.findOne({
      isActive: true,
      isDefault: true
    });
    
    // Use category-specific charges if available, otherwise use default
    const chargeDoc = categoryChargeDoc || defaultChargeDoc;
    
    if (chargeDoc) {
      const allCharges = chargeDoc.charges.map(charge => ({
        ...charge.toObject(),
        calculatedAmount: calculateChargeAmount(charge, subtotal)
      }));
      
      // Filter out duplicate charges of the same type, keeping only the highest priority one
      applicableCharges = filterDuplicateCharges(allCharges);
    }
  }
  
  return applicableCharges;
};

// Helper function to filter duplicate charges of the same type
function filterDuplicateCharges(charges) {
  const chargeMap = new Map();
  
  charges.forEach(charge => {
    const key = charge.chargeType;
    
    if (!chargeMap.has(key)) {
      chargeMap.set(key, charge);
    } else {
      const existingCharge = chargeMap.get(key);
      
      // If the new charge has a calculated amount > 0 and higher priority, use it
      if (charge.calculatedAmount > 0 && charge.priority > existingCharge.priority) {
        chargeMap.set(key, charge);
      }
      // If the existing charge has calculated amount = 0 but new charge has amount > 0, use new charge
      else if (existingCharge.calculatedAmount === 0 && charge.calculatedAmount > 0) {
        chargeMap.set(key, charge);
      }
      // If both have calculated amount > 0, keep the one with higher priority
      else if (charge.calculatedAmount > 0 && existingCharge.calculatedAmount > 0 && charge.priority > existingCharge.priority) {
        chargeMap.set(key, charge);
      }
    }
  });
  
  return Array.from(chargeMap.values());
}

// Helper function to calculate charge amount
function calculateChargeAmount(charge, subtotal) {
  let amount = 0;
  
  if (charge.calculationType === 'fixed') {
    amount = charge.value;
  } else if (charge.calculationType === 'percentage') {
    amount = (subtotal * charge.value) / 100;
  }
  
  // Check conditions
  if (subtotal < charge.minOrderAmount) {
    return 0;
  }
  
  if (charge.maxOrderAmount && subtotal > charge.maxOrderAmount) {
    return 0;
  }
  
  return amount;
}

module.exports = mongoose.model('ChargesAndTaxes', chargesAndTaxesSchema);