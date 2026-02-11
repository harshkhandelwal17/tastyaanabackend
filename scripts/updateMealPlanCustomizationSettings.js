const mongoose = require('mongoose');
const MealPlan = require('../models/MealPlan');
require('dotenv').config();

const defaultCustomizationSettings = {
  allowCustomization: true,
  allowMealReplacement: true,
  allowExtraItems: true,
  allowDietaryChanges: true,
  customizationDeadline: '06:00',
  maxExtraItems: 5,
  allowedCustomizations: ['no-onions', 'less-spicy', 'no-garlic', 'extra-rice'],
  restrictedDays: []
};

async function updateMealPlanCustomizationSettings() {
  try {
    // Connect to MongoDB
    const connectionString = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find meal plans without customization settings
    const mealPlansWithoutSettings = await MealPlan.find({
      $or: [
        { customizationSettings: { $exists: false } },
        { customizationSettings: null },
        { 'customizationSettings.allowCustomization': { $exists: false } }
      ]
    });

    console.log(`Found ${mealPlansWithoutSettings.length} meal plans without customization settings`);

    if (mealPlansWithoutSettings.length === 0) {
      console.log('All meal plans already have customization settings');
      return;
    }

    // Update each meal plan
    for (const mealPlan of mealPlansWithoutSettings) {
      console.log(`Updating meal plan: ${mealPlan.title} (${mealPlan._id})`);
      
      // Merge existing settings with defaults
      const updatedSettings = {
        ...defaultCustomizationSettings,
        ...(mealPlan.customizationSettings || {})
      };

      await MealPlan.findByIdAndUpdate(
        mealPlan._id,
        { customizationSettings: updatedSettings },
        { new: true }
      );
    }

    console.log('Successfully updated all meal plans with default customization settings');

  } catch (error) {
    console.error('Error updating meal plan customization settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  updateMealPlanCustomizationSettings();
}

module.exports = updateMealPlanCustomizationSettings; 