const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const addOnSchema = new mongoose.Schema(
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
    appliesToAll: {
      type: Boolean,
      default: false,
    },
    isActive: {
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
addOnSchema.index({ mealPlan: 1, isActive: 1 });

// Static method to get addons by meal plan ID
addOnSchema.statics.findByMealPlan = async function (mealPlanId) {
  return this.find({ mealPlan: mealPlanId, isActive: true });
};

const AddOn =  mongoose.model('AddOn', addOnSchema);

module.exports = AddOn;
