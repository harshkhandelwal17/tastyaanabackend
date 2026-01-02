const mongoose = require('mongoose');
const MealPlan = require('../models/MealPlan');
require('dotenv').config();

async function updateMealPlanShifts() {
  try {
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Find meal plans without shifts field or with empty shifts
    const mealPlansToUpdate = await MealPlan.find({
      $or: [
        { shifts: { $exists: false } },
        { shifts: null },
        { shifts: { $size: 0 } }
      ]
    });

    console.log(`Found ${mealPlansToUpdate.length} meal plans to update`);

    if (mealPlansToUpdate.length === 0) {
      console.log('No meal plans need updating');
      return;
    }

    // Update each meal plan to include both morning and evening shifts
    for (const mealPlan of mealPlansToUpdate) {
      console.log(`Updating meal plan: ${mealPlan.title} (ID: ${mealPlan._id})`);
      
      await MealPlan.findByIdAndUpdate(
        mealPlan._id,
        { 
          shifts: ['morning', 'evening'] // Set both shifts by default
        },
        { new: true }
      );
      
      console.log(`✓ Updated meal plan: ${mealPlan.title}`);
    }

    console.log(`Successfully updated ${mealPlansToUpdate.length} meal plans with both morning and evening shifts`);

  } catch (error) {
    console.error('Error updating meal plan shifts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  updateMealPlanShifts();
}

module.exports = updateMealPlanShifts;
