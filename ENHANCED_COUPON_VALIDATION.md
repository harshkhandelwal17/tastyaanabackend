# Enhanced Coupon Validation System

## Overview

The coupon validation system has been enhanced with new limiting mechanisms to provide more granular control over coupon usage. The new system includes three main types of limits:

1. **Per-user limit** - Controls how many times each user can use a coupon
2. **Per-user per-day limit** - Controls daily usage per user
3. **Total coupon usage limit** - Controls total usage across all users

## New Fields Added

### Coupon Model (`models/Coupon.js`)

```javascript
// New fields in the coupon schema
maxUsagePerUserPerDay: {
  type: Number,
  default: null, // null = unlimited daily usage
  min: 1
},
totalUsageLimit: {
  type: Number,
  default: null, // null = unlimited total usage
  min: 1
}
```

## Validation Logic

### 1. Total Usage Validation

Checks if the coupon has reached its overall usage limit across all users.

```javascript
if (this.totalUsageLimit !== null) {
  const totalUsageCount = await CouponUsage.countDocuments({
    couponId: this._id,
  });

  if (totalUsageCount >= this.totalUsageLimit) {
    return { canUse: false, reason: "Total coupon usage limit exceeded" };
  }
}
```

### 2. Per-User Usage Validation

Checks if the user has exceeded their personal usage limit for this coupon.

```javascript
const userUsageCount = await CouponUsage.countDocuments({
  couponId: this._id,
  userId: userId,
});

if (userUsageCount >= this.maxUsagePerUser) {
  return {
    canUse: false,
    reason: `Maximum usage limit (${this.maxUsagePerUser}) reached for this user`,
  };
}
```

### 3. Per-User Per-Day Validation

Checks if the user has exceeded their daily usage limit for this coupon.

```javascript
if (this.maxUsagePerUserPerDay !== null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayUsageCount = await CouponUsage.countDocuments({
    couponId: this._id,
    userId: userId,
    usedAt: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  if (todayUsageCount >= this.maxUsagePerUserPerDay) {
    return {
      canUse: false,
      reason: `Daily usage limit (${this.maxUsagePerUserPerDay}) reached for today`,
    };
  }
}
```

## API Endpoints

### Create Coupon with Enhanced Limits

**POST** `/api/coupons`

```json
{
  "code": "MULTI1000",
  "description": "Coupon that can be used 1000 times per user",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 100,
  "maxUsagePerUser": 1000,
  "maxUsagePerUserPerDay": 5,
  "totalUsageLimit": 50000,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

### Validate Coupon

**POST** `/api/coupons/validate`

```json
{
  "code": "MULTI1000",
  "orderAmount": 500,
  "orderItems": [...],
  "orderType": "gkk"
}
```

### Get Enhanced Usage Statistics

**GET** `/api/coupons/:id/enhanced-stats`

Response:

```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "...",
      "code": "MULTI1000",
      "maxUsagePerUser": 1000,
      "maxUsagePerUserPerDay": 5,
      "totalUsageLimit": 50000
    },
    "statistics": {
      "totalUsage": 1250,
      "remainingTotalUsage": 48750,
      "usagePercentage": 3,
      "userStats": {
        "totalUsage": 25,
        "todayUsage": 2,
        "remainingUsage": 975,
        "remainingTodayUsage": 3
      }
    }
  }
}
```

## Usage Examples

### Example 1: High-Volume User Coupon

```javascript
const coupon = {
  code: "LOYAL1000",
  description: "Loyalty coupon - 1000 uses per user",
  discountType: "percentage",
  discountValue: 15,
  maxUsagePerUser: 1000,
  maxUsagePerUserPerDay: 10,
  totalUsageLimit: 100000,
  // ... other fields
};
```

### Example 2: Daily Deal Coupon

```javascript
const coupon = {
  code: "DAILY5",
  description: "Daily deal - max 5 times per user per day",
  discountType: "fixed",
  discountValue: 50,
  maxUsagePerUser: 50,
  maxUsagePerUserPerDay: 5,
  totalUsageLimit: 10000,
  // ... other fields
};
```

### Example 3: Limited Flash Sale

```javascript
const coupon = {
  code: "FLASH100",
  description: "Flash sale - only 100 total uses",
  discountType: "percentage",
  discountValue: 30,
  maxUsagePerUser: 1,
  maxUsagePerUserPerDay: 1,
  totalUsageLimit: 100,
  // ... other fields
};
```

## Error Messages

The system provides clear error messages for different validation failures:

- `"Total coupon usage limit exceeded"` - When the total usage limit is reached
- `"Maximum usage limit (X) reached for this user"` - When user reaches their personal limit
- `"Daily usage limit (X) reached for today"` - When user reaches their daily limit

## Database Considerations

### Indexes

The following indexes are recommended for optimal performance:

```javascript
// CouponUsage collection
db.couponusages.createIndex({ couponId: 1, userId: 1, usedAt: -1 });
db.couponusages.createIndex({ couponId: 1, usedAt: -1 });
```

### Query Optimization

- Daily usage queries use date range filtering for efficiency
- User usage counts are cached where possible
- Compound indexes support multi-field queries

## Migration Guide

### Existing Coupons

For existing coupons that don't have the new fields:

- `maxUsagePerUserPerDay`: defaults to `null` (unlimited)
- `totalUsageLimit`: defaults to `null` (unlimited)
- Existing `maxUsagePerUser` behavior is maintained

### Database Migration

No migration script is needed as the new fields have default values. Existing coupons will continue to work as before.

## Testing

Run the enhanced coupon validation test:

```bash
cd server
node test-enhanced-coupon-validation.js
```

This will test all the new validation scenarios and provide detailed output showing how the limits work.

## Benefits

1. **Flexible Usage Control**: Different types of limits for different business needs
2. **Fraud Prevention**: Prevents abuse while allowing legitimate multiple uses
3. **Marketing Flexibility**: Supports various promotional strategies
4. **Performance Optimized**: Efficient database queries and indexing
5. **Backward Compatible**: Existing coupons continue to work unchanged

## Implementation Notes

- All new fields are optional and default to `null` (unlimited)
- Validation order: Total limit → User limit → Daily limit → Other validations
- Date calculations use timezone-aware logic
- Error messages are user-friendly and specific
- Statistics endpoint provides comprehensive usage data
