# Charges and Taxes System

This document describes the comprehensive charges and taxes system implemented for the Tastyaana platform.

## Overview

The system supports multiple types of charges and taxes that can be applied based on:
- Product categories
- Order amount
- Weather conditions
- Time periods
- Default fallback rules

## Features

### 1. Charge Types
- **Rain Charges**: Applied during rainy weather conditions
- **Packing Charges**: Applied for packaging materials
- **Taxes**: Category-specific tax rates
- **Delivery Charges**: Shipping and delivery fees
- **Service Charges**: Platform service fees

### 2. Configuration Options
- **Fixed Amount**: Fixed charge regardless of order value
- **Percentage**: Percentage-based charge on order subtotal
- **Category-Specific**: Different rates for different product categories
- **Default Fallback**: Default charges when no category matches
- **Priority System**: Higher priority charges override lower ones
- **Time-Based**: Valid from/to date ranges
- **Order Amount Conditions**: Min/max order amount requirements

## Database Schema

### ChargesAndTaxes Model
```javascript
{
  name: String,                    // Charge name
  type: String,                    // rain_charge, packing_charge, tax, etc.
  categoryId: ObjectId,            // Optional category reference
  isActive: Boolean,               // Enable/disable charge
  isDefault: Boolean,              // Default charge for unmatched categories
  chargeType: String,              // 'fixed' or 'percentage'
  amount: Number,                  // Charge amount or percentage
  minOrderAmount: Number,          // Minimum order amount
  maxOrderAmount: Number,          // Maximum order amount
  weatherCondition: String,        // Weather condition for rain charges
  validFrom: Date,                 // Start date
  validUntil: Date,                // End date
  priority: Number,                // Priority level
  description: String,             // Charge description
  createdBy: ObjectId,             // Admin who created
  updatedBy: ObjectId              // Admin who last updated
}
```

## API Endpoints

### Public Endpoints
- `POST /api/charges/applicable` - Get applicable charges for an order
- `GET /api/charges/form-data` - Get form data for admin interface

### Admin Endpoints
- `GET /api/charges` - Get all charges (with filters)
- `POST /api/charges` - Create new charge
- `PUT /api/charges/:id` - Update charge
- `DELETE /api/charges/:id` - Delete charge

## Usage Examples

### 1. Getting Applicable Charges
```javascript
const response = await axios.post('/api/charges/applicable', {
  items: [
    { category: 'food', categoryId: '...', price: 100, quantity: 2 },
    { category: 'grocery', categoryId: '...', price: 50, quantity: 1 }
  ],
  subtotal: 250,
  orderDate: '2024-01-15T10:30:00Z'
});
```

### 2. Frontend Integration
```javascript
import { useCharges } from '../hooks/useCharges';

const { getApplicableCharges, getChargesBreakdown } = useCharges();

// Get charges for cart
const charges = await getApplicableCharges(cartItems, subtotal);

// Calculate breakdown
const breakdown = getChargesBreakdown(charges);
// Returns: { rainCharges: 25, packingCharges: 15, taxes: 12.5, ... }
```

## Configuration Examples

### 1. Rain Charges
```javascript
{
  name: 'Monsoon Rain Charge',
  type: 'rain_charge',
  isDefault: true,
  chargeType: 'fixed',
  amount: 25,
  weatherCondition: 'rain',
  priority: 10
}
```

### 2. Category-Specific Tax
```javascript
{
  name: 'Food Items Tax',
  type: 'tax',
  categoryId: 'food_category_id',
  chargeType: 'percentage',
  amount: 5, // 5% tax
  priority: 20
}
```

### 3. Default Tax
```javascript
{
  name: 'Default Tax',
  type: 'tax',
  isDefault: true,
  chargeType: 'percentage',
  amount: 4, // 4% tax
  priority: 1 // Lower priority than category-specific
}
```

## Priority System

Charges are applied based on priority:
1. **Higher priority** charges override lower priority ones
2. **Category-specific** charges override default charges
3. **Active** charges only (isActive: true)
4. **Valid date range** charges only

## Weather Integration

Rain charges can be triggered based on weather conditions:
- `any`: Always apply
- `rain`: Light rain
- `heavy_rain`: Heavy rain
- `storm`: Storm conditions

*Note: Weather integration requires external weather API*

## Setup Instructions

### 1. Database Setup
```bash
# Run the seeder to populate sample charges
node server/scripts/seedCharges.js
```

### 2. Frontend Integration
```javascript
// In your checkout component
import { useCharges } from '../hooks/useCharges';

const { getApplicableCharges, getChargesBreakdown } = useCharges();

// Fetch charges when cart changes
useEffect(() => {
  if (cartItems.length > 0) {
    getApplicableCharges(cartItems, subtotal);
  }
}, [cartItems, subtotal]);
```

### 3. Admin Interface
The system includes admin endpoints for managing charges through the admin panel.

## Testing Scenarios

### 1. Basic Order
- Items: 2 food items (₹100 each)
- Expected: Food tax (5%) + packing charge + service charge

### 2. Mixed Categories
- Items: 1 food item + 1 grocery item
- Expected: Category-specific taxes + default charges

### 3. High Value Order
- Items: Order above ₹500
- Expected: Premium packing charge + free delivery

### 4. Rainy Weather
- Items: Any items during rain
- Expected: Rain charges + other applicable charges

## Error Handling

The system includes comprehensive error handling:
- Invalid charge configurations
- Missing category references
- Date range validation
- Amount validation
- Priority conflicts

## Performance Considerations

- Charges are cached for better performance
- Database indexes on frequently queried fields
- Efficient querying with proper filtering
- Minimal API calls with batch processing

## Future Enhancements

1. **Weather API Integration**: Real-time weather data
2. **Dynamic Pricing**: Time-based pricing adjustments
3. **Promotional Charges**: Discount and promotion integration
4. **Analytics**: Charge application analytics
5. **A/B Testing**: Charge configuration testing
6. **Bulk Operations**: Mass charge updates
