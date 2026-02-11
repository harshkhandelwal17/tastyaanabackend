# Enhanced Coupon Validation System

## Overview

The enhanced coupon validation system introduces advanced usage limits and validation logic for better coupon management. This system allows for sophisticated coupon campaigns with multiple types of restrictions.

## New Features

### 1. Per-User Usage Limit (`maxUsagePerUser`)

- **Purpose**: Controls how many times a single user can use a coupon across its lifetime
- **Example**: A coupon with `maxUsagePerUser: 1000` allows each user to use it up to 1000 times
- **Use Case**: Loyalty programs, frequent customer rewards

```javascript
const coupon = new Coupon({
  code: "LOYALTY1000",
  maxUsagePerUser: 1000, // Each user can use 1000 times
  // ... other fields
});
```

### 2. Per-User Per-Day Limit (`maxUsagePerUserPerDay`)

- **Purpose**: Controls how many times a user can use a coupon in a single day
- **Example**: A coupon with `maxUsagePerUserPerDay: 5` limits users to 5 uses per day
- **Use Case**: Flash sales, daily deals, preventing abuse

```javascript
const coupon = new Coupon({
  code: "DAILY5",
  maxUsagePerUserPerDay: 5, // Max 5 uses per user per day
  // ... other fields
});
```

### 3. Total Usage Limit (`totalUsageLimit`)

- **Purpose**: Controls the total number of times a coupon can be used across all users
- **Example**: A coupon with `totalUsageLimit: 10000` can only be used 10,000 times total
- **Use Case**: Limited campaigns, inventory-based promotions

```javascript
const coupon = new Coupon({
  code: "LIMITED10K",
  totalUsageLimit: 10000, // Total 10,000 uses across all users
  // ... other fields
});
```

## Validation Priority

The validation system checks restrictions in the following order:

1. **Total Usage Limit** - Check if coupon has reached its total usage limit
2. **Per-User Usage Limit** - Check if user has reached their personal usage limit
3. **Per-User Per-Day Limit** - Check if user has reached their daily usage limit
4. **Targeting Restrictions** - Check targeting rules (geographic, user segments, etc.)
5. **Legacy Restrictions** - Check backward compatibility restrictions

## API Endpoints

### Create Coupon with Enhanced Limits

```http
POST /api/coupons
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "code": "ENHANCED2025",
  "description": "Enhanced coupon with multiple limits",
  "discountType": "percentage",
  "discountValue": 20,
  "maxUsagePerUser": 1000,
  "maxUsagePerUserPerDay": 5,
  "totalUsageLimit": 10000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### Validate Coupon

```http
POST /api/coupons/validate
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "code": "ENHANCED2025",
  "orderAmount": 500,
  "orderItems": [...]
}
```

### Get Enhanced Usage Statistics

```http
GET /api/coupons/:couponId/enhanced-stats
Authorization: Bearer <user-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "...",
      "code": "ENHANCED2025",
      "maxUsagePerUser": 1000,
      "maxUsagePerUserPerDay": 5,
      "totalUsageLimit": 10000
    },
    "statistics": {
      "totalUsage": 1250,
      "remainingTotalUsage": 8750,
      "usagePercentage": 12.5,
      "userStats": {
        "totalUsage": 45,
        "todayUsage": 3,
        "remainingUsage": 955,
        "remainingTodayUsage": 2
      }
    }
  }
}
```

## Database Schema Changes

### Coupon Model Updates

```javascript
// New fields added to Coupon schema
{
  maxUsagePerUserPerDay: {
    type: Number,
    default: null,  // null = unlimited daily usage
    min: 1
  },
  totalUsageLimit: {
    type: Number,
    default: null,  // null = unlimited total usage
    min: 1
  }
}
```

### CouponUsage Model

The existing `CouponUsage` model tracks individual usage instances with timestamps, enabling daily limit calculations.

## Frontend Integration

### React Component Usage

```jsx
import EnhancedCouponStats from "./components/coupons/EnhancedCouponStats";

function CouponDetail({ couponId }) {
  return (
    <div>
      <EnhancedCouponStats couponId={couponId} />
    </div>
  );
}
```

### API Integration

```javascript
import { getEnhancedUsageStatistics, validateCoupon } from "./api/couponApi";

// Get statistics
const stats = await getEnhancedUsageStatistics(couponId);

// Validate coupon with enhanced logic
const validation = await validateCoupon({
  code: "ENHANCED2025",
  orderAmount: 500,
  orderItems: cartItems,
});
```

## Error Messages

The enhanced system provides specific error messages for each type of limit:

- `"Total coupon usage limit exceeded"` - When totalUsageLimit is reached
- `"Maximum usage limit (1000) reached for this user"` - When maxUsagePerUser is reached
- `"Daily usage limit (5) reached for today"` - When maxUsagePerUserPerDay is reached

## Use Cases and Examples

### 1. Loyalty Program Coupon

```javascript
{
  code: 'VIP_MEMBER',
  maxUsagePerUser: 50,        // VIP members can use 50 times
  maxUsagePerUserPerDay: 3,   // But only 3 times per day
  totalUsageLimit: null       // Unlimited total uses
}
```

### 2. Flash Sale Coupon

```javascript
{
  code: 'FLASH_SALE',
  maxUsagePerUser: 1,         // One use per customer
  maxUsagePerUserPerDay: 1,   // One use per day
  totalUsageLimit: 1000       // Limited to 1000 total uses
}
```

### 3. Daily Deal Coupon

```javascript
{
  code: 'DAILY_DEAL',
  maxUsagePerUser: 365,       // Can use daily for a year
  maxUsagePerUserPerDay: 1,   // Once per day
  totalUsageLimit: null       // Unlimited total uses
}
```

### 4. Frequent Buyer Reward

```javascript
{
  code: 'FREQUENT_BUYER',
  maxUsagePerUser: 1000,      // Very high personal limit
  maxUsagePerUserPerDay: 10,  // Multiple uses per day allowed
  totalUsageLimit: 50000      // Large but finite total limit
}
```

## Testing

Run the test script to verify the enhanced validation logic:

```bash
cd server
node test-enhanced-coupon-validation.js
```

The test script will:

1. Create a test user and enhanced coupon
2. Simulate multiple coupon uses
3. Test each validation rule
4. Verify daily limits reset logic
5. Test total usage limits
6. Display usage statistics

## Backward Compatibility

The enhanced system maintains full backward compatibility:

- Existing coupons continue to work with the original `maxUsagePerUser` logic
- New fields are optional (default `null` means unlimited)
- Legacy validation rules are preserved
- Existing API endpoints return enhanced data without breaking changes

## Performance Considerations

- Added database indexes for efficient date-range queries
- Optimized aggregation queries for usage statistics
- Caching strategies for frequently accessed coupon data
- Bulk operations for high-volume usage tracking

## Security Features

- Rate limiting on coupon validation endpoints
- User session validation for coupon usage
- Audit logging for all coupon operations
- Protection against concurrent usage attempts
- Input validation and sanitization

## Future Enhancements

1. **Time-based Limits**: Hourly, weekly, monthly usage limits
2. **Category-specific Limits**: Different limits for different product categories
3. **Progressive Limits**: Increasing limits based on user loyalty level
4. **Geographic Limits**: Location-based usage restrictions
5. **Dynamic Limits**: AI-powered dynamic limit adjustments
