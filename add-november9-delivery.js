const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');
const User = require('./models/User');

// Connect to database
mongoose.connect('mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function addNovember9Delivery() {
  try {
    console.log('=== Adding November 9, 2025 Delivery ===');
    
    const subscription = await Subscription.findById('690dff45800659574068765c');
    
    if (!subscription) {
      console.log('❌ Subscription not found');
      return;
    }
    
    // Add specific delivery for November 9, 2025
    const nov9Delivery = {
      date: new Date('2025-11-09T00:00:00.000Z'),
      shift: 'evening',
      status: 'delivered',
      isActive: true,
      thaliCount: 1,
      customizations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveredAt: new Date('2025-11-09T19:30:00.000Z'), // 7:30 PM delivery
      deliveredBy: subscription.user // Mock delivery by subscription owner
    };
    
    // Check if November 9 delivery already exists
    const existingNov9 = subscription.deliveryTracking.find(d => {
      return d.date.toDateString() === new Date('2025-11-09').toDateString() && d.shift === 'evening';
    });
    
    if (existingNov9) {
      console.log('✅ November 9 delivery already exists:', {
        date: existingNov9.date.toISOString().split('T')[0],
        shift: existingNov9.shift,
        status: existingNov9.status
      });
    } else {
      subscription.deliveryTracking.push(nov9Delivery);
      await subscription.save();
      console.log('✅ Added November 9, 2025 evening delivery');
    }
    
    // Show all deliveries around November 9
    console.log('\\n=== Deliveries around November 9 ===');
    const nearbyDeliveries = subscription.deliveryTracking.filter(d => {
      const deliveryDate = new Date(d.date);
      const nov5 = new Date('2025-11-05');
      const nov15 = new Date('2025-11-15');
      return deliveryDate >= nov5 && deliveryDate <= nov15;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    nearbyDeliveries.forEach(delivery => {
      const dateStr = delivery.date.toISOString().split('T')[0];
      console.log(`📅 ${dateStr} (${delivery.shift}): ${delivery.status} ${delivery.deliveredAt ? '✓' : ''}`);
    });
    
    console.log('\\n=== Calendar Test ===');
    console.log('✅ 1. Login as user: 68717ebc7395056035d1718d');
    console.log('✅ 2. View subscription: 690dff45800659574068765c');
    console.log('✅ 3. November 9th should show GREEN DOT (delivered evening meal)');
    console.log('✅ 4. Other November dates should show various colored indicators');

  } catch (error) {
    console.error('❌ Error adding November 9 delivery:', error);
  } finally {
    mongoose.disconnect();
  }
}

addNovember9Delivery();