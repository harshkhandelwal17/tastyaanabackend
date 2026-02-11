# Laundry System Improvements - Complete Implementation

## Overview
This document outlines all the improvements made to the laundry system to support a comprehensive multi-vendor platform with three service types: Quick Service, Scheduled Service, and Monthly Subscription.

## Key Features Implemented

### 1. Three Service Types
- **Quick Service**: Fast pickup and delivery (within 4-8 hours)
- **Scheduled Service**: Pre-booked pickup and delivery slots
- **Monthly Subscription**: Recurring service with benefits

### 2. Multi-Vendor Support
- Multiple vendors can register on the platform
- Each vendor can configure their own:
  - Pricing (per-piece or weight-based)
  - Services offered (wash_fold, wash_iron, dry_clean, iron_only, shoe_cleaning, folding_only)
  - Service areas (pincodes)
  - Operational hours
  - Quick and scheduled service configurations

### 3. Flexible Pricing Models
- **Per-Piece Pricing**: Traditional pricing per item
- **Weight-Based Pricing**: Pricing based on total weight (kg)
- **Hybrid Model**: Support for both pricing models simultaneously

### 4. Different Charges for Service Types
- **Quick Service**: Higher pickup/delivery charges + surcharge
- **Scheduled Service**: Standard charges
- **Subscription**: Free or discounted charges

## Backend Changes

### Models Updated

#### LaundryVendor Model
- Added `pricingConfig` with support for:
  - Pricing model (per_piece, weight_based, hybrid)
  - Weight-based pricing per service type
  - Minimum weight threshold
- Added separate `charges` for quick, scheduled, and subscription services
- Added `quickServiceConfig`:
  - Enable/disable quick service
  - Min order value, max weight
  - Operating hours and available days
  - Turnaround time (min/max hours)
- Added `scheduledServiceConfig`:
  - Enable/disable scheduled service
  - Advance booking days
  - Time slot capacity management
- Added new service types: `shoe_cleaning`, `folding_only`

#### LaundryOrder Model
- Added `deliverySpeed` field (quick, scheduled, subscription)
- Enhanced `items` schema to support:
  - Pricing model per item (per_piece or weight_based)
  - Price per item and price per kg
  - Individual item weight
- Enhanced `pricing` schema:
  - Speed surcharge (for quick service)
  - Subscription discount
  - Pricing breakdown (per-piece total, weight-based total)

### Controllers Updated

#### laundryOrderController.js
- Updated `createOrder` to:
  - Validate delivery speed
  - Calculate pricing based on delivery speed
  - Handle subscription orders
  - Support both pricing models
- Updated `calculatePrice` to accept deliverySpeed and subscriptionId

#### laundryVendorController.js
- Added `updatePricing`: Update vendor pricing configuration
- Added `updateServices`: Update services and specializations
- Added `updateQuickServiceConfig`: Configure quick service settings
- Added `updateScheduledServiceConfig`: Configure scheduled service settings

### Utilities Updated

#### laundryHelpers.js
- Enhanced `calculateOrderPrice` function:
  - Supports per-piece and weight-based pricing
  - Different charges based on delivery speed
  - Subscription discounts
  - Pricing breakdown tracking

## Frontend Changes

### Services Updated

#### laundryService.js
- Updated `calculatePrice` to accept `deliverySpeed` and `subscriptionId`
- Updated `createOrder` to ensure `deliverySpeed` is included

### Components Updated

#### BookingPage.jsx
- Added delivery speed toggle (Quick/Scheduled)
- Updated price calculation to include delivery speed
- Updated order creation to include delivery speed in order data

## API Endpoints

### New Vendor Management Endpoints
- `PATCH /api/laundry/vendors/:id/pricing` - Update pricing
- `PATCH /api/laundry/vendors/:id/services` - Update services
- `PATCH /api/laundry/vendors/:id/quick-service` - Configure quick service
- `PATCH /api/laundry/vendors/:id/scheduled-service` - Configure scheduled service

### Updated Endpoints
- `POST /api/laundry/calculate-price` - Now accepts `deliverySpeed` and `subscriptionId`
- `POST /api/laundry/orders` - Now accepts `deliverySpeed` in order data

## Usage Examples

### Creating a Quick Service Order
```javascript
const orderData = {
  vendorId: 'vendor_id',
  items: [
    {
      type: 'shirt',
      category: 'topwear',
      serviceType: 'wash_fold',
      quantity: 5,
      pricingModel: 'per_piece' // or 'weight_based'
    }
  ],
  deliverySpeed: 'quick',
  pickup: {
    date: new Date(),
    timeSlot: 'immediate',
    address: { ... }
  },
  paymentMethod: 'online'
};
```

### Creating a Weight-Based Order
```javascript
const orderData = {
  vendorId: 'vendor_id',
  items: [
    {
      type: 'shirt',
      category: 'topwear',
      serviceType: 'wash_fold',
      quantity: 5,
      pricingModel: 'weight_based',
      weight: 0.3, // kg per item
      pricePerKg: 50
    }
  ],
  deliverySpeed: 'scheduled',
  // ... rest of order data
};
```

### Configuring Vendor Quick Service
```javascript
PATCH /api/laundry/vendors/:id/quick-service
{
  enabled: true,
  minOrderValue: 200,
  maxWeight: 10,
  operatingHours: {
    start: '09:00',
    end: '19:00'
  },
  availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  turnaroundTime: {
    min: 4,
    max: 8
  }
}
```

## Benefits

1. **Flexibility**: Vendors can choose their pricing model and service configurations
2. **Scalability**: Multi-vendor platform supports unlimited vendors
3. **User Choice**: Users can choose between quick, scheduled, or subscription services
4. **Fair Pricing**: Different charges for different service speeds
5. **Comprehensive Services**: Support for all laundry services including shoes, ironing, folding

## Next Steps (Optional Enhancements)

1. Add vendor dashboard for managing settings
2. Add weight estimation tool for users
3. Add real-time order tracking
4. Add vendor analytics and reporting
5. Add bulk pricing discounts
6. Add coupon/promo code support
7. Add vendor rating and review system

## Testing Checklist

- [ ] Create vendor with per-piece pricing
- [ ] Create vendor with weight-based pricing
- [ ] Create vendor with hybrid pricing
- [ ] Enable quick service for vendor
- [ ] Create quick service order
- [ ] Create scheduled service order
- [ ] Create subscription order
- [ ] Test price calculation with different delivery speeds
- [ ] Test weight-based pricing calculation
- [ ] Test per-piece pricing calculation
- [ ] Update vendor pricing
- [ ] Update vendor services
- [ ] Update quick service configuration
- [ ] Update scheduled service configuration

