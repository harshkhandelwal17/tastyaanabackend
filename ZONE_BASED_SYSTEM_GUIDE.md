# Zone-Based Vehicle Rental System

## Overview

This system implements a hierarchical structure where:

- **Sellers** can have multiple zones
- Each **Zone** has its own vehicles, bookings, and one worker
- **Sellers** can see all zones and bookings across their business
- **Workers** can only see data for their assigned zone

## Architecture

### User Roles

1. **Seller**: Owns multiple zones, can see everything
2. **Worker**: Assigned to one zone, can only see zone-specific data
3. **Buyer**: Regular customers who book vehicles
4. **Admin**: System administrators

### Data Structure

#### 1. User Schema Changes

**New Role**: Added `'worker'` to the role enum.

**Enhanced Seller Profile**:

```javascript
sellerProfile: {
  vehicleRentalService: {
    serviceZones: [
      {
        zoneName: String,
        zoneCode: String,
        workerId: ObjectId, // NEW: References the worker for this zone
        address: String,
        coordinates: { lat: Number, lng: Number },
        // ... other zone details
      },
    ];
  }
}
```

**New Worker Profile**:

```javascript
workerProfile: {
  sellerId: ObjectId,     // References the seller
  zoneId: String,         // Zone identifier
  zoneCode: String,       // Zone code
  zoneName: String,       // Zone name
  isActive: Boolean,
  joinedDate: Date,
  performance: {
    bookingsHandled: Number,
    averageRating: Number,
    totalRatings: Number
  },
  workingHours: {
    // Working hours for each day
  }
}
```

#### 2. Vehicle Schema Changes

**New Field**:

```javascript
zoneId: {
  type: String,
  required: true,
  index: true,
  description: 'Unique identifier for the zone this vehicle belongs to'
}
```

**New Indexes**:

```javascript
vehicleSchema.index({ sellerId: 1, zoneId: 1 });
vehicleSchema.index({ zoneId: 1, availability: 1 });
```

#### 3. VehicleBooking Schema Changes

**New Field**:

```javascript
zoneId: {
  type: String,
  required: true,
  index: true,
  description: 'Unique identifier for the zone this booking belongs to'
}
```

**New Index**:

```javascript
vehicleBookingSchema.index({ zoneId: 1, bookingDate: -1 });
```

## Implementation Guide

### 1. Migration

Run the migration script to update existing data:

```bash
node migrate-zone-system.js
```

To also set up sample data for testing:

```bash
node migrate-zone-system.js --setup-sample
```

### 2. Creating a Seller with Zones

```javascript
const seller = new User({
  name: "Vehicle Rental Business",
  email: "seller@example.com",
  role: "seller",
  sellerProfile: {
    vehicleRentalService: {
      isEnabled: true,
      serviceStatus: "active",
      serviceZones: [
        {
          zoneName: "Downtown Zone",
          zoneCode: "DT001",
          workerId: workerObjectId, // Assign worker
          address: "123 Downtown Street",
          coordinates: { lat: 28.6139, lng: 77.209 },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "20:00", isOpen: true },
            // ... other days
          },
        },
      ],
    },
  },
});
```

### 3. Creating a Worker

```javascript
const worker = new User({
  name: "Zone Worker",
  email: "worker@example.com",
  role: "worker",
  workerProfile: {
    sellerId: sellerObjectId,
    zoneId: "DT001",
    zoneCode: "DT001",
    zoneName: "Downtown Zone",
    isActive: true,
    performance: {
      bookingsHandled: 0,
      averageRating: 0,
      totalRatings: 0,
    },
  },
});
```

### 4. Creating Zone-specific Vehicles

```javascript
const vehicle = new Vehicle({
  name: "Honda Activa",
  category: "scooty",
  zoneId: "DT001", // Links to zone
  sellerId: sellerObjectId,
  // ... other vehicle details
});
```

### 5. Creating Zone-specific Bookings

```javascript
const booking = new VehicleBooking({
  vehicleId: vehicleObjectId,
  userId: customerObjectId,
  zoneId: "DT001", // Links to zone
  zone: "Downtown Zone",
  // ... other booking details
});
```

## Query Examples

### Seller Queries (Can see everything)

```javascript
// Get all zones for a seller
async function getSellerZones(sellerId) {
  const seller = await User.findById(sellerId);
  return seller.sellerProfile.vehicleRentalService.serviceZones;
}

// Get all vehicles across all zones
async function getSellerVehicles(sellerId) {
  return Vehicle.find({ sellerId });
}

// Get all bookings across all zones
async function getSellerBookings(sellerId) {
  const seller = await User.findById(sellerId);
  const zoneIds = seller.sellerProfile.vehicleRentalService.serviceZones.map(
    (zone) => zone.zoneCode
  );

  return VehicleBooking.find({
    zoneId: { $in: zoneIds },
  }).sort({ bookingDate: -1 });
}
```

### Worker Queries (Zone-specific only)

```javascript
// Get worker's zone data
async function getWorkerZoneData(workerId) {
  const worker = await User.findById(workerId);
  const { zoneId } = worker.workerProfile;

  // Only vehicles in worker's zone
  const vehicles = await Vehicle.find({ zoneId });

  // Only bookings in worker's zone
  const bookings = await VehicleBooking.find({ zoneId }).sort({
    bookingDate: -1,
  });

  return { worker, vehicles, bookings };
}
```

## API Routes Structure

### Seller Routes

```
GET /api/seller/zones - Get all zones
GET /api/seller/vehicles - Get all vehicles
GET /api/seller/bookings - Get all bookings
GET /api/seller/workers - Get all workers
```

### Worker Routes

```
GET /api/worker/zone - Get assigned zone info
GET /api/worker/vehicles - Get zone vehicles only
GET /api/worker/bookings - Get zone bookings only
```

### Zone-specific Routes

```
GET /api/zones/:zoneId/vehicles - Get vehicles in specific zone
GET /api/zones/:zoneId/bookings - Get bookings in specific zone
GET /api/zones/:zoneId/worker - Get zone worker
```

## Security Considerations

### Authentication & Authorization

1. **Sellers** can access all their zones and data
2. **Workers** can only access their assigned zone data
3. **Customers** can only access their own bookings

### Middleware Example

```javascript
// Zone access control middleware
const checkZoneAccess = async (req, res, next) => {
  const { zoneId } = req.params;
  const user = req.user;

  if (user.role === "seller") {
    // Check if zone belongs to seller
    const zones = user.sellerProfile.vehicleRentalService.serviceZones;
    const hasAccess = zones.some((zone) => zone.zoneCode === zoneId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this zone" });
    }
  } else if (user.role === "worker") {
    // Check if worker is assigned to this zone
    if (user.workerProfile.zoneId !== zoneId) {
      return res.status(403).json({ error: "Access denied to this zone" });
    }
  }

  next();
};
```

## Testing

Use the examples in `zone-based-system-examples.js` to test the system functionality:

```javascript
const examples = require("./zone-based-system-examples");

// Test seller dashboard
const sellerData = await examples.getSellerDashboard(sellerId);

// Test worker dashboard
const workerData = await examples.getWorkerDashboard(workerId);
```

## Seller Booking Management & Cash Flow Tracking

### Overview

Sellers can now create offline bookings for walk-in customers directly from their portal. This feature includes comprehensive cash flow management to track cash vs online payments.

### New Features

#### 1. Offline Booking Creation

Sellers can create bookings for customers who visit their physical location:

- **Customer Registration**: Auto-create customer accounts for walk-ins
- **Vehicle Selection**: Choose from available vehicles in seller's zones
- **Payment Tracking**: Record both cash and online payment amounts
- **Instant Confirmation**: Offline bookings are auto-confirmed

#### 2. Cash Flow Management

Track all payment methods and cash handling:

**Payment Types Supported**:

- Cash payments (tracked separately)
- Online payments (UPI, Cards, etc.)
- Partial payments (cash + online combination)

**Cash Tracking Features**:

- Daily cash collection summary
- Cash in hand vs handed over to admin
- Pending payment tracking
- Receipt generation for cash handovers

### Implementation Details

#### VehicleBooking Model Updates

```javascript
// New fields added to VehicleBooking schema
{
  bookingSource: {
    type: String,
    enum: ['online', 'offline', 'seller-portal', 'worker-portal', 'admin'],
    default: 'online'
  },

  cashFlowDetails: {
    isOfflineBooking: Boolean,
    cashPaymentDetails: {
      totalCashReceived: Number,
      onlinePaymentAmount: Number,
      pendingCashAmount: Number,
      cashReceivedBy: ObjectId, // Seller/Worker who received cash
      cashReceivedAt: Date,
      notes: String
    },
    sellerCashFlow: {
      dailyCashCollected: Number,
      isHandedOverToAdmin: Boolean,
      handoverDate: Date,
      handoverReceiptNo: String
    }
  }
}
```

#### API Endpoints

**Seller Booking Routes**:

```
POST   /api/seller/create-offline           - Create offline booking
GET    /api/seller/vehicles/available       - Get available vehicles
GET    /api/seller/bookings                 - Get seller's bookings
PUT    /api/seller/bookings/:id/cash-payment - Update cash payment
GET    /api/seller/cash-flow/summary        - Cash flow summary
POST   /api/seller/cash-flow/handover       - Mark cash handover
GET    /api/seller/cash-flow/daily-report   - Daily cash report
```

### Usage Examples

#### Create Offline Booking

```javascript
const bookingData = {
  vehicleId: "vehicle_id",
  customerDetails: {
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com", // optional
  },
  startDateTime: "2023-12-25T10:00:00Z",
  endDateTime: "2023-12-25T18:00:00Z",
  cashAmount: 500, // Cash received
  onlineAmount: 200, // Online payment
  notes: "Walk-in customer",
  zoneId: "DT001",
};

const response = await fetch("/api/seller/create-offline", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(bookingData),
});
```

#### Get Cash Flow Summary

```javascript
const summary = await fetch('/api/seller/cash-flow/summary?startDate=2023-12-01&endDate=2023-12-31', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Returns:
{
  totalBookings: 150,
  onlineBookings: 100,
  offlineBookings: 50,
  totalRevenue: 75000,
  totalCashCollected: 25000,
  totalOnlinePayments: 45000,
  pendingCash: 5000,
  cashInHand: 20000,
  cashHandedOver: 5000
}
```

#### Dashboard Components

The system includes comprehensive dashboard components:

1. **Overview Tab**: Summary of bookings and cash flow
2. **Create Booking Tab**: Form to create offline bookings
3. **Cash Flow Tab**: Detailed cash management interface
4. **Bookings List**: View and manage all bookings

### Benefits

1. **Offline Customer Support**: Handle walk-in customers effectively
2. **Cash Flow Transparency**: Complete visibility of cash movements
3. **Payment Flexibility**: Accept multiple payment methods
4. **Financial Control**: Track cash handovers and pending collections
5. **Zone-based Management**: Manage bookings per zone/worker

### Security & Access Control

- **Seller Access**: Can create bookings for all their zones
- **Worker Access**: Can create bookings only for assigned zone
- **Cash Tracking**: All cash transactions are logged with user ID and timestamp
- **Handover Management**: Proper tracking of cash handovers to admin

## Benefits

1. **Scalability**: Sellers can manage multiple zones independently
2. **Access Control**: Workers only see relevant zone data
3. **Performance**: Optimized queries with proper indexing
4. **Data Isolation**: Clear separation between zones
5. **Flexibility**: Easy to add new zones or reassign workers
6. **Cash Management**: Comprehensive offline payment tracking
7. **Customer Service**: Support for walk-in customers

## Next Steps

1. Run the migration script
2. Update your API routes to include zone-based access control
3. Update the frontend to handle zone-based data display
4. Implement seller booking dashboard interface
5. Test cash flow tracking functionality
6. Deploy and monitor performance
