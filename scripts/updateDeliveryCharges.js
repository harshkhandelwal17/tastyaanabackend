const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });
const mongoose = require('mongoose');
const CategorySlot = require('../models/CategorySlot');

// Load environment variables

// Delivery charge configuration
const DEFAULT_DELIVERY_CHARGE = 15;

// Category IDs and their free delivery slots
const DAYS = [
  { dayOfWeek: 0, dayName: 'Sunday' },
  { dayOfWeek: 1, dayName: 'Monday' },
  { dayOfWeek: 2, dayName: 'Tuesday' },
  { dayOfWeek: 3, dayName: 'Wednesday' },
  { dayOfWeek: 4, dayName: 'Thursday' },
  { dayOfWeek: 5, dayName: 'Friday' },
  { dayOfWeek: 6, dayName: 'Saturday' }
];

// Quick delivery slot configuration
const QUICK_DELIVERY_SLOT = {
  startTime: '8:00',
  endTime: '23:00',
  name: 'Quick Delivery',
  isQuickDelivery: true,
  isActive: true, // Ensure it's always active
  quickOrderCharge: 30, // Additional charge for quick delivery
  maxOrders: 20, // Lower max orders for quick delivery
  maxAdvanceBookingDays: 1, // Only allow booking one day in advance
  description: 'Express delivery with priority handling',
  allowsQuickOrder: true,
  allowsScheduledOrder: false
};

const CATEGORY_CONFIGS = [
  {
    id: '688fb41ebea1c163a6eda193', // Foodzone
    name: 'Foodzone',
    // Free delivery slots for all days
    freeSlots: [
      { startTime: '12:01', endTime: '13:00', deliveryCharge: 0 },
      { startTime: '19:00', endTime: '20:00', deliveryCharge: 0 }
    ],
    // Default slots to ensure exist (will be created if not found)
    requiredSlots: [
      { startTime: '12:01', endTime: '13:00' },
      { startTime: '19:00', endTime: '20:00' },
      { ...QUICK_DELIVERY_SLOT, name: 'Quick Delivery' }
    ]
  },
  {
    id: '68b14f3debcbba39abe74441', // Breakfast
    name: 'Breakfast',
    // Free delivery slots for all days
    freeSlots: [
      { startTime: '08:00', endTime: '09:00', deliveryCharge: 0 }
    ],
    // Default slots to ensure exist (will be created if not found)
    requiredSlots: [
      { startTime: '08:00', endTime: '09:00' },
      { ...QUICK_DELIVERY_SLOT, name: 'Quick Delivery' }
    ]
  },
  {
    id: '6882f8f15b1ba9254864dfe7', // Vegetables
    name: 'Vegetables',
    // Free delivery slots for all days
    freeSlots: [
      { startTime: '18:00', endTime: '19:00', deliveryCharge: 0 }
    ],
    // Default slots to ensure exist (will be created if not found)
    requiredSlots: [
      { startTime: '18:00', endTime: '19:00' },
      { ...QUICK_DELIVERY_SLOT, name: 'Quick Delivery' }
    ]
  }
];

async function updateDeliveryCharges() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect("mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Process each category with special delivery charges
    for (const category of CATEGORY_CONFIGS) {
      console.log(`\nProcessing category: ${category.name} (${category.id})`);
      
      // Find all slot documents for this category (one per day)
      const categorySlots = await CategorySlot.find({ category: category.id });
      
      if (!categorySlots || categorySlots.length === 0) {
        console.log(`❌ No slot configurations found for category: ${category.name}`);
        console.log(`   Make sure category slots are created for ${category.name} first.`);
        continue;
      }

      // Process each day's slots
      for (const slotDoc of categorySlots) {
        console.log(`\n📅 Updating slots for ${slotDoc.dayName}...`);
        
        // Initialize slots array if it doesn't exist
        if (!slotDoc.slots) {
          slotDoc.slots = [];
        }
        
        // Ensure required slots exist
        for (const requiredSlot of category.requiredSlots) {
          const slotExists = slotDoc.slots.some(s => 
            s.startTime === requiredSlot.startTime && 
            s.endTime === requiredSlot.endTime
          );
          
          if (!slotExists) {
            // Check if this is a free delivery slot
            const isFreeSlot = category.freeSlots.some(fs => 
              fs.startTime === requiredSlot.startTime && 
              fs.endTime === requiredSlot.endTime
            );
            
            const deliveryCharge = isFreeSlot ? 0 : DEFAULT_DELIVERY_CHARGE;
            
            console.log(`   ➕ Adding new slot: ${requiredSlot.startTime}-${requiredSlot.endTime} ` + 
                       `(Delivery: ₹${deliveryCharge}${isFreeSlot ? ' - FREE DELIVERY' : ''})`);
            
            const isQuickDelivery = requiredSlot.isQuickDelivery || false;
            const slotConfig = {
              startTime: requiredSlot.startTime,
              endTime: requiredSlot.endTime,
              isActive: requiredSlot.isActive !== false, // Respect isActive if explicitly set to false
              maxOrders: isQuickDelivery ? (requiredSlot.maxOrders || 20) : 100,
              orderCount: 0,
              deliveryCharge: deliveryCharge,
              allowsQuickOrder: isQuickDelivery, // Only allow quick orders for quick delivery slots
              quickOrderCharge: isQuickDelivery ? (requiredSlot.quickOrderCharge || 30) : 0,
              allowsScheduledOrder: !isQuickDelivery, // Don't allow scheduled orders for quick delivery
              maxAdvanceBookingDays: isQuickDelivery ? 1 : 7,
              isQuickDelivery: isQuickDelivery,
              name: requiredSlot.name || (isQuickDelivery ? 'Quick Delivery' : ''),
              description: requiredSlot.description || (isQuickDelivery ? 'Express delivery with priority handling' : '')
            };
            
            slotDoc.slots.push(slotConfig);
          }
        }

        console.log(`   Found ${slotDoc.slots.length} slots for ${slotDoc.dayName}:`);
        slotDoc.slots.forEach(slot => {
          console.log(`   - ${slot.startTime} to ${slot.endTime} (current charge: ₹${slot.deliveryCharge})`);
        });
        
        let updateCount = 0;
        const matchedSlots = [];
        
        // First, check which free slots will match
        for (const freeSlot of category.freeSlots) {
          const slotIndex = slotDoc.slots.findIndex(s => 
            s.startTime === freeSlot.startTime && 
            s.endTime === freeSlot.endTime
          );

          if (slotIndex !== -1) {
            matchedSlots.push(`${freeSlot.startTime}-${freeSlot.endTime}`);
          } else {
            console.log(`   ❗ Could not find or create slot: ${freeSlot.startTime}-${freeSlot.endTime}`);
          }
        }

        if (matchedSlots.length === 0) {
          console.log(`   ℹ️  No matching slots found for free delivery times in ${category.name} on ${slotDoc.dayName}`);
          console.log(`   Looking for slots at: ${category.freeSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}`);
        } else {
          console.log(`   ✅ Will update ${matchedSlots.length} slots to free delivery`);
          
          // Update all slots to default charge first
          slotDoc.slots.forEach(slot => {
            slot.deliveryCharge = DEFAULT_DELIVERY_CHARGE;
          });

          // Then apply free delivery to matching slots
          for (const freeSlot of category.freeSlots) {
            const slotIndex = slotDoc.slots.findIndex(s => 
              s.startTime === freeSlot.startTime && 
              s.endTime === freeSlot.endTime
            );

            if (slotIndex !== -1) {
              slotDoc.slots[slotIndex].deliveryCharge = freeSlot.deliveryCharge;
              updateCount++;
              console.log(`   Set free delivery for ${freeSlot.startTime}-${freeSlot.endTime} on ${slotDoc.dayName}`);
            }
          }

          // Save the updated document
          await slotDoc.save();
          console.log(`   💾 Saved changes for ${category.name} on ${slotDoc.dayName}`);
        }
      }
      
      console.log(`\nCompleted updates for ${category.name}`);
      console.log(`- Default delivery charge: ₹${DEFAULT_DELIVERY_CHARGE}`);
      console.log(`- Free delivery slots: ${category.freeSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}`);
    }

    // No need for separate update as we're handling it per category now
    console.log('\nDelivery charges update completed successfully!');

  } catch (error) {
    console.error('Error updating delivery charges:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateDeliveryCharges();
