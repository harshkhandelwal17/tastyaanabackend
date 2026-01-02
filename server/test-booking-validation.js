// Quick test to verify VehicleBooking model validation
const mongoose = require('mongoose');

// Mock VehicleBooking schema for testing
const vehicleBookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  rateType: {
    type: String,
    enum: ['hourly12', 'hourly24'],
    required: true
  },
  billing: {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    extraKmCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    extraHourCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    fuelCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    damageCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    cleaningCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    tollCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFees: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      couponCode: String,
      discountType: String // renamed from 'type' to avoid conflicts
    },
    taxes: {
      gst: {
        type: Number,
        default: 0
      },
      serviceTax: {
        type: Number,
        default: 0
      }
    },
    totalBill: {
      type: Number,
      required: true,
      min: 0
    }
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  }
});

const TestVehicleBooking = mongoose.model('TestVehicleBooking', vehicleBookingSchema);

// Test booking data
const testBookingData = {
  vehicleId: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  startDateTime: new Date('2025-12-18T10:00:00.000Z'),
  endDateTime: new Date('2025-12-18T14:00:00.000Z'),
  rateType: 'hourly24',
  billing: {
    baseAmount: 240,
    extraKmCharge: 0,
    extraHourCharge: 0,
    fuelCharges: 0,
    damageCharges: 0,
    cleaningCharges: 0,
    tollCharges: 0,
    lateFees: 0,
    discount: {
      amount: 0,
      couponCode: '',
      discountType: ''
    },
    taxes: {
      gst: 43,
      serviceTax: 0
    },
    totalBill: 3283
  },
  depositAmount: 3000
};

// Test validation
try {
  const testBooking = new TestVehicleBooking(testBookingData);
  const validationError = testBooking.validateSync();
  
  if (validationError) {
    console.log('❌ Validation failed:');
    console.log(validationError.message);
    console.log('\nValidation errors:');
    for (const field in validationError.errors) {
      console.log(`- ${field}: ${validationError.errors[field].message}`);
    }
  } else {
    console.log('✅ Validation passed!');
    console.log('Test booking structure is valid');
  }
} catch (error) {
  console.log('❌ Error during validation:');
  console.log(error.message);
}