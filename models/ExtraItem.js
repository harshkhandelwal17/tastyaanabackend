const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const extraItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['beverage', 'snack', 'dessert', 'other'],
      default: 'other',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster querying
extraItemSchema.index({ mealPlan: 1, isAvailable: 1 });

// Static method to get extra items by meal plan ID
extraItemSchema.statics.findByMealPlan = async function (mealPlanId) {
  return this.find({ mealPlan: mealPlanId, isAvailable: true });
};

const ExtraItem = model('ExtraItem', extraItemSchema);

module.exports = ExtraItem;
