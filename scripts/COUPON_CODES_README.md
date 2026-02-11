# 🎫 Raw Coupon Codes for All Types

This document contains **27 ready-to-use coupon codes** covering all implemented coupon types and targeting options.

## 📋 Quick Reference

### **Percentage Discount Coupons**
| Code | Description | Discount | Min Order | Max Discount | Targeting |
|------|-------------|----------|-----------|--------------|-----------|
| `SAVE20` | 20% off on your order | 20% | ₹200 | ₹100 | General |
| `WELCOME15` | 15% off for new users | 15% | ₹100 | ₹50 | New users only |
| `VIP25` | 25% off for VIP customers | 25% | ₹500 | ₹200 | VIP + High value |
| `DELHI20` | 20% off for Delhi customers | 20% | ₹200 | ₹100 | Delhi only |
| `MUMBAI15` | 15% off for Mumbai customers | 15% | ₹300 | ₹75 | Mumbai only |
| `MORNING15` | 15% off on morning orders | 15% | ₹150 | ₹50 | Weekdays 9AM-12PM |
| `WEEKEND20` | 20% off on weekends | 20% | ₹200 | ₹100 | Weekends only |
| `GKK10` | 10% off on GKK orders | 10% | ₹100 | ₹50 | GKK orders only |
| `SUBSCRIPTION25` | 25% off on subscription orders | 25% | ₹500 | ₹200 | Subscription only |
| `UPI20` | 20% off on UPI payments | 20% | ₹200 | ₹100 | UPI payments only |
| `WALLET15` | 15% off on wallet payments | 15% | ₹150 | ₹75 | Wallet payments only |
| `FOOD20` | 20% off on food items | 20% | ₹200 | ₹100 | Food category only |
| `GROCERY15` | 15% off on grocery items | 15% | ₹300 | ₹75 | Grocery category only |

### **Fixed Amount Discount Coupons**
| Code | Description | Discount | Min Order | Targeting |
|------|-------------|----------|-----------|-----------|
| `FLAT50` | Flat ₹50 off on your order | ₹50 | ₹200 | General |
| `FIRST100` | ₹100 off on first order | ₹100 | ₹300 | First-time customers |

### **Free Shipping Coupons**
| Code | Description | Min Order | Max Usage | Targeting |
|------|-------------|-----------|-----------|-----------|
| `FREESHIP` | Free delivery on your order | ₹200 | 2000 | General |
| `SHIPFREE500` | Free delivery on orders above ₹500 | ₹500 | 1000 | High-value orders |

### **Buy One Get One (BOGO) Coupons**
| Code | Description | BOGO Config | Min Order | Max Usage |
|------|-------------|-------------|-----------|-----------|
| `BOGO100` | Buy 1 Get 1 Free | Buy 1, Get 1 (100% off) | ₹100 | 500 |
| `BOGO50` | Buy 1 Get 1 at 50% off | Buy 1, Get 1 (50% off) | ₹150 | 300 |

### **Buy X Get Y Coupons**
| Code | Description | Buy X Get Y Config | Min Order | Max Usage |
|------|-------------|-------------------|-----------|-----------|
| `BUY3GET2` | Buy 3 Get 2 Free | Buy 3, Get 2 (100% off) | ₹300 | 200 |
| `BUY2GET1` | Buy 2 Get 1 at 30% off | Buy 2, Get 1 (30% off) | ₹200 | 400 |

### **Cashback Coupons**
| Code | Description | Cashback | Min Order | Targeting |
|------|-------------|----------|-----------|-----------|
| `CASHBACK25` | ₹25 cashback to wallet | ₹25 | ₹250 | General |
| `CASHBACK50` | ₹50 cashback to wallet | ₹50 | ₹500 | High-value customers |

### **Points Multiplier Coupons**
| Code | Description | Multiplier | Min Order | Max Points | Targeting |
|------|-------------|------------|-----------|------------|-----------|
| `POINTS2X` | 2x loyalty points on this order | 2x | ₹200 | 100 | General |
| `POINTS3X` | 3x loyalty points on this order | 3x | ₹400 | 200 | VIP customers |

### **Stackable Coupons**
| Code | Description | Discount | Min Order | Priority | Notes |
|------|-------------|----------|-----------|----------|-------|
| `STACK10` | 10% off (can be stacked) | 10% | ₹100 | 20 | Low priority for stacking |
| `STACK5` | 5% off (can be stacked) | 5% | ₹100 | 10 | Lowest priority for stacking |

## 🚀 How to Use

### **1. Create Coupons via API**
```bash
# Create a single coupon
curl -X POST http://localhost:5000/api/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "code": "SAVE20",
    "description": "20% off on your order",
    "discountType": "percentage",
    "discountValue": 20,
    "maxDiscount": 100,
    "minOrderAmount": 200,
    "maxUsage": 1000,
    "maxUsagePerUser": 1,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "priority": 50
  }'
```

### **2. Create All Coupons via Script**
```bash
# Navigate to server directory
cd server

# Create all coupon examples
node scripts/coupon-examples.js --create
```

### **3. Use Raw JSON Data**
```javascript
// Import the raw coupon data
const couponData = require('./scripts/raw-coupon-codes.json');

// Create coupons programmatically
for (const coupon of couponData.couponExamples) {
  // Add required fields
  const fullCouponData = {
    ...coupon,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdBy: 'YOUR_ADMIN_USER_ID'
  };
  
  // Create coupon via API or direct database insertion
  await createCoupon(fullCouponData);
}
```

## 🎯 Targeting Examples

### **User Targeting**
```json
{
  "targeting": {
    "userTargeting": {
      "userSegments": ["new_users", "vip_customers"],
      "userBehavior": {
        "minOrderCount": 5,
        "minTotalSpent": 1000,
        "maxOrderCount": 50
      }
    }
  }
}
```

### **Geographic Targeting**
```json
{
  "targeting": {
    "geographicTargeting": {
      "applicableCities": ["Delhi", "Mumbai", "Bangalore"],
      "applicableStates": ["Delhi", "Maharashtra", "Karnataka"],
      "excludeCities": ["Chennai"]
    }
  }
}
```

### **Time-based Targeting**
```json
{
  "targeting": {
    "timeTargeting": {
      "applicableDays": ["monday", "tuesday", "wednesday"],
      "applicableTimeSlots": [
        {"start": "09:00", "end": "12:00"},
        {"start": "14:00", "end": "17:00"}
      ]
    }
  }
}
```

### **Order-based Targeting**
```json
{
  "targeting": {
    "orderTargeting": {
      "applicableOrderTypes": ["gkk", "subscription"],
      "applicablePaymentMethods": ["upi", "wallet"],
      "minOrderValue": 200,
      "maxOrderValue": 1000
    }
  }
}
```

## 🔧 Special Discount Configurations

### **BOGO Configuration**
```json
{
  "specialDiscount": {
    "bogoConfig": {
      "buyQuantity": 1,
      "getQuantity": 1,
      "getDiscount": 100
    }
  }
}
```

### **Buy X Get Y Configuration**
```json
{
  "specialDiscount": {
    "buyXGetYConfig": {
      "buyQuantity": 3,
      "getQuantity": 2,
      "getDiscount": 100
    }
  }
}
```

### **Cashback Configuration**
```json
{
  "specialDiscount": {
    "cashbackConfig": {
      "cashbackAmount": 50,
      "cashbackType": "wallet"
    }
  }
}
```

### **Points Multiplier Configuration**
```json
{
  "specialDiscount": {
    "pointsConfig": {
      "multiplier": 2,
      "maxPoints": 100
    }
  }
}
```

## 📊 Priority System

Coupons are applied based on priority (higher number = higher priority):

- **Priority 80-100**: VIP/Exclusive coupons
- **Priority 60-79**: Special offers
- **Priority 40-59**: Regular discounts
- **Priority 20-39**: Low-value offers
- **Priority 1-19**: Stackable coupons

## 🎁 Campaign Management

Each coupon can be tagged with campaign information:

```json
{
  "campaign": {
    "name": "Summer Sale 2024",
    "description": "Summer discount campaign",
    "tags": ["summer", "sale", "percentage"]
  }
}
```

## 🔍 Testing Coupons

### **Validate a Coupon**
```bash
curl -X POST http://localhost:5000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "code": "SAVE20",
    "orderAmount": 500,
    "orderType": "gkk",
    "paymentMethod": "cod"
  }'
```

### **Get Available Coupons**
```bash
curl -X GET "http://localhost:5000/api/coupons/available?orderAmount=500&orderType=gkk&paymentMethod=cod" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## 📝 Notes

1. **Replace Placeholder IDs**: Update `applicableCategories` with actual category IDs from your database
2. **Admin User ID**: Replace `ADMIN_USER_ID` with actual admin user ID
3. **Date Ranges**: Adjust `startDate` and `endDate` as needed
4. **Usage Limits**: Modify `maxUsage` and `maxUsagePerUser` based on your requirements
5. **Priority**: Adjust priority values to control coupon stacking behavior

## 🎉 Ready to Use!

All 27 coupon codes are ready to be created and used in your system. They cover all implemented coupon types and targeting options, providing a comprehensive foundation for your coupon marketing campaigns!
