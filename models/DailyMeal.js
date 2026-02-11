// models/DailyMeal.js
const mongoose = require('mongoose');

const dailyMealSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  date: {
    type: Date,
    required: true,
    unique: true
  },
  meals: {

    SpecialDiningThali: {
      lunch: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      },
      dinner: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      }
    },
    RoyalDiningThali: {
      lunch: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      },
      dinner: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      }
    },
    EveryMensThali: {
      lunch: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      },
      dinner: {
        items: [{
          name: String,
          description: String,
          quantity: String
        }],
        totalCalories: Number,
        price: Number
      }
    }
  },
  // Dynamic Menu Support
  planMenus: [{
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan'
    },
    lunch: {
      items: [{
        name: String,
        description: String,
        quantity: String
      }],
      isAvailable: { type: Boolean, default: true }
    },
    dinner: {
      items: [{
        name: String,
        description: String,
        quantity: String
      }],
      isAvailable: { type: Boolean, default: true }
    }
  }],
  sundaySpecial: {
    isSpecialDay: {
      type: Boolean,
      default: false
    },
    specialItems: [{
      name: String,
      description: String,
      price: Number,
      category: String
    }],
    extraCharges: Number,
    includedInPlan: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    tier: String,
    slot: String,
    url: String,
    alt: String
  }],
  nutritionalInfo: {
    low: {
      calories: Number,
      protein: String,
      carbs: String,
      fat: String
    },
    basic: {
      calories: Number,
      protein: String,
      carbs: String,
      fat: String
    },
    premium: {
      calories: Number,
      protein: String,
      carbs: String,
      fat: String
    }
  },
  chefSpecial: {
    isChefSpecial: {
      type: Boolean,
      default: false
    },
    specialNote: String,
    chefName: String
  },
  availability: {
    low: {
      type: Boolean,
      default: true
    },
    basic: {
      type: Boolean,
      default: true
    },
    premium: {
      type: Boolean,
      default: true
    }
  },
  maxOrders: {
    type: Number,
    default: 1000
  },
  currentOrders: {
    type: Number,
    default: 0
  },
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    tier: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String], // e.g., ["comfort-food", "seasonal", "festival-special"]
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});


// Check if today is Sunday
dailyMealSchema.methods.isSunday = function () {
  return this.date.getDay() === 0;
};


module.exports = mongoose.model('DailyMeal', dailyMealSchema);


