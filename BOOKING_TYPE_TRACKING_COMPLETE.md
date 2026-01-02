# Booking Type Tracking - Offline vs Online Differentiation

## ✅ IMPLEMENTATION COMPLETE

Your vehicle booking system now has comprehensive tracking to differentiate between **offline** and **online** bookings with two complementary fields:

### 🔄 **Core Fields for Booking Type Tracking**

#### 1. **`bookingSource`** (Primary Field)

```javascript
bookingSource: {
  type: String,
  enum: ['online', 'offline', 'seller-portal', 'worker-portal', 'admin'],
  default: 'online',
  index: true
}
```

**Values:**

- `'online'` - Customer booked directly through website/app
- `'seller-portal'` - Seller created booking for walk-in customer
- `'worker-portal'` - Worker created booking
- `'offline'` - General offline booking
- `'admin'` - Admin created booking

#### 2. **`cashFlowDetails.isOfflineBooking`** (Secondary Field)

```javascript
cashFlowDetails: {
  isOfflineBooking: {
    type: Boolean,
    default: false,
    description: 'True if booking was created offline by seller/worker'
  }
}
```

**Values:**

- `true` - Offline booking with cash handling
- `false` - Online booking with digital payments

---

## 🎯 **How It Works**

### **Online Bookings:**

```javascript
// Set when customer books online
{
  bookingSource: 'online',
  cashFlowDetails: {
    isOfflineBooking: false,
    cashPaymentDetails: {
      totalCashReceived: 0,
      onlinePaymentAmount: fullAmount,
      notes: 'Online booking via user portal'
    }
  }
}
```

### **Offline Bookings:**

```javascript
// Set when seller creates booking for walk-in customer
{
  bookingSource: 'seller-portal',
  cashFlowDetails: {
    isOfflineBooking: true,
    cashPaymentDetails: {
      totalCashReceived: cashAmount,
      onlinePaymentAmount: 0,
      cashReceivedBy: sellerId,
      notes: 'Offline booking created by seller'
    }
  }
}
```

---

## 🛠️ **Helper Methods Available**

### **Static Methods (Model Level)**

```javascript
// Check booking types
const isOnline = VehicleBooking.isOnlineBooking(booking);
const isOffline = VehicleBooking.isOfflineBooking(booking);

// Get bookings by type
const onlineBookings = await VehicleBooking.getBookingsByType("online");
const offlineBookings = await VehicleBooking.getBookingsByType("offline");

// Get statistics
const stats = await VehicleBooking.getBookingStats({
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});
```

### **Instance Methods (Individual Booking)**

```javascript
// Get detailed type information
const typeInfo = booking.getBookingTypeInfo();
// Returns: {
//   source: 'seller-portal',
//   type: 'offline',
//   isOfflineBooking: true,
//   createdBy: 'Seller (Offline)',
//   paymentMethod: 'cash',
//   cashReceived: 5000
// }

const creator = booking.getCreatedBy(); // 'Seller (Offline)'
```

---

## 📊 **Analytics API Endpoints**

### **Get Booking Statistics**

```http
GET /api/admin/booking-analytics/stats?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**

```json
{
  "success": true,
  "data": {
    "online": {
      "count": 150,
      "totalRevenue": 750000,
      "averageBookingValue": 5000
    },
    "offline": [
      {
        "_id": "seller-portal",
        "count": 80,
        "totalRevenue": 400000,
        "totalCashReceived": 300000
      }
    ],
    "summary": {
      "totalOnline": 150,
      "totalOffline": 80,
      "onlinePercentage": "65.22",
      "offlinePercentage": "34.78"
    }
  }
}
```

### **Get Bookings by Type**

```http
GET /api/admin/booking-analytics/by-type?type=offline&page=1&limit=10
```

### **Get Individual Booking Type Info**

```http
GET /api/admin/booking-analytics/:bookingId/type-info
```

---

## 💼 **Business Logic Examples**

### **Different Pricing for Online vs Offline**

```javascript
// In your pricing logic
const calculateBookingPrice = (basePrice, booking) => {
  let finalPrice = basePrice;

  if (VehicleBooking.isOnlineBooking(booking)) {
    // Online discount
    finalPrice *= 0.95; // 5% discount for online
  } else if (VehicleBooking.isOfflineBooking(booking)) {
    // Offline convenience fee
    finalPrice += 100; // ₹100 handling fee for offline
  }

  return finalPrice;
};
```

### **Commission Calculation**

```javascript
// Different commission rates
const calculateCommission = (booking) => {
  const amount = booking.billing.finalAmount;

  if (booking.bookingSource === "online") {
    return amount * 0.1; // 10% for online
  } else if (booking.bookingSource === "seller-portal") {
    return amount * 0.15; // 15% for offline (higher for service)
  }

  return amount * 0.12; // Default 12%
};
```

### **Cash Flow Management**

```javascript
// Track cash collection
const getDailyCashFlow = async (sellerId, date) => {
  const offlineBookings = await VehicleBooking.find({
    bookedBy: sellerId,
    bookingDate: {
      $gte: startOfDay(date),
      $lte: endOfDay(date),
    },
    "cashFlowDetails.isOfflineBooking": true,
  });

  const totalCashCollected = offlineBookings.reduce(
    (sum, booking) =>
      sum + booking.cashFlowDetails.cashPaymentDetails.totalCashReceived,
    0
  );

  return { totalCashCollected, bookingCount: offlineBookings.length };
};
```

---

## ✅ **Current Implementation Status**

- ✅ **Database Schema** - Fields added and indexed
- ✅ **Online Booking Controller** - Sets `bookingSource: 'online'` and `isOfflineBooking: false`
- ✅ **Offline Booking Controller** - Sets `bookingSource: 'seller-portal'` and `isOfflineBooking: true`
- ✅ **Helper Methods** - Static and instance methods for easy type checking
- ✅ **Analytics API** - Endpoints for reporting and statistics
- ✅ **Cash Flow Tracking** - Detailed cash payment tracking for offline bookings
- ✅ **Verification Script** - Tool to test and demonstrate functionality

---

## 🚀 **Next Steps for Your Business Logic**

1. **Implement Dynamic Pricing** based on booking source
2. **Create Commission Rules** with different rates for online/offline
3. **Build Cash Reconciliation** reports for offline bookings
4. **Add Notification Logic** with different messages for each type
5. **Create Performance Dashboards** comparing online vs offline metrics

The foundation is complete and ready for your specific business logic implementation!
