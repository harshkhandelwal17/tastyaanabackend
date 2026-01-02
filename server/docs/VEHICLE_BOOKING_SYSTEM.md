# Vehicle Booking Confirmation & Pickup Verification System

## Overview

This system implements a complete vehicle rental booking workflow with seller approval requirements and secure pickup verification.

## System Components

### 1. Vehicle Configuration (`Vehicle.js`)

#### `requireConfirmation` Field

```javascript
requireConfirmation: {
  type: Boolean,
  default: true,
  description: 'If true, seller must approve booking request before confirmation. If false, booking is auto-confirmed after payment.'
}
```

**Behavior:**

- `requireConfirmation: true` → Booking goes to "awaiting_approval" status after payment (DEFAULT)
- `requireConfirmation: false` → Booking goes to "confirmed" status after payment

### 2. Booking Workflow (`VehicleBooking.js`)

#### Booking Statuses

- `pending` → Initial booking created, payment not completed
- `awaiting_approval` → Payment completed, waiting for seller approval (when requireConfirmation = true)
- `confirmed` → Booking approved and confirmed
- `ongoing` → Vehicle pickup completed, rental in progress
- `completed` → Vehicle returned successfully
- `cancelled` → Booking cancelled
- `no-show` → Customer didn't show up for pickup

#### Verification Codes

```javascript
verificationCodes: {
  pickup: {
    code: String, // 4-digit code generated automatically
    verified: Boolean,
    verifiedAt: Date,
    verifiedBy: ObjectId
  },
  drop: {
    code: String, // 4-digit code generated automatically
    verified: Boolean,
    verifiedAt: Date,
    verifiedBy: ObjectId
  }
}
```

### 3. API Endpoints

#### Booking Creation

```
POST /api/vehicles/bookings
```

- Creates booking in `pending` status
- Generates pickup/drop verification codes automatically
- Validates vehicle availability and booking conflicts

#### Payment Verification

```
POST /api/vehicles/bookings/payment/verify
```

**Logic:**

```javascript
// After successful payment verification
if (vehicle.requireConfirmation === true) {
  booking.bookingStatus = "awaiting_approval";
  // Seller needs to approve
} else {
  booking.bookingStatus = "confirmed";
  // Auto-confirmed
}
```

#### Seller Approval

```
PUT /api/vehicles/bookings/:id/approval
Body: { action: 'approve'|'deny', reason?: 'string' }
```

#### Vehicle Pickup Process

```
POST /api/vehicles/bookings/:id/documents
```

- Upload customer documents (driving license, ID proof, etc.)
- Documents are verified by seller during pickup

### 4. Complete Booking Flow

#### Step 1: Booking Creation

1. Customer selects vehicle and dates
2. System validates availability
3. Booking created with status `pending`
4. Verification codes auto-generated

#### Step 2: Payment Processing

1. Customer completes payment via Razorpay
2. Payment verification triggers status update:
   - If `vehicle.requireConfirmation = false` → Status: `confirmed`
   - If `vehicle.requireConfirmation = true` → Status: `awaiting_approval`

#### Step 3: Seller Approval (Conditional)

**If requireConfirmation = true:**

1. Seller receives booking request notification
2. Seller reviews booking details
3. Seller approves or denies:
   - **Approve:** Status changes to `confirmed`
   - **Deny:** Status changes to `cancelled`, refund initiated

#### Step 4: Pickup Process

1. **Customer arrives at pickup location**
2. **Document Verification:**
   - Customer shows documents (driving license, ID proof)
   - Seller verifies documents match booking details
   - Documents uploaded to system if needed

3. **Verification Code Process:**
   - Seller enters pickup verification code
   - System validates the 4-digit code
   - Status changes to `ongoing`
   - Vehicle availability updated to `not-available`

4. **Vehicle Handover:**
   - Vehicle condition checked
   - Accessories verified (helmet, toolkit, etc.)
   - Customer takes possession

#### Step 5: Return Process

1. **Customer returns vehicle**
2. **Drop Verification:**
   - Seller enters drop verification code
   - Vehicle condition assessed
   - Any damages noted

3. **Completion:**
   - Status changes to `completed`
   - Vehicle availability updated to `available`
   - Security deposit processed

## Security Features

### 1. Verification Codes

- 4-digit randomly generated codes
- Separate codes for pickup and drop
- Codes can only be verified once
- Timestamp tracking for verification

### 2. Document Verification

- Mandatory driving license verification
- ID proof upload and verification
- Document URLs stored securely in Cloudinary
- Verification status tracked per document

### 3. Permission Checks

- Only vehicle owner (seller) can approve bookings
- Only verified users can verify pickup/drop codes
- Document access restricted to booking participants

## API Examples

### 1. Create Booking

```javascript
POST /api/vehicles/bookings
{
  "vehicleId": "64abc123def456789",
  "startDateTime": "2025-12-22T10:00:00.000Z",
  "endDateTime": "2025-12-22T18:00:00.000Z",
  "rateType": "hourly12",
  "customerDetails": {
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "drivingLicense": {
      "number": "MH1234567890",
      "expiryDate": "2026-12-31"
    }
  }
}
```

### 2. Verify Payment (Auto-confirmation logic)

```javascript
POST /api/vehicles/bookings/payment/verify
{
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "signature_xxx",
  "bookingId": "64abc123def456789"
}

// Response includes requiresApproval flag
{
  "success": true,
  "message": "Payment successful. Booking is pending seller approval.",
  "data": {
    "booking": {...},
    "bookingStatus": "awaiting_approval",
    "requiresApproval": true
  }
}
```

### 3. Seller Approval

```javascript
PUT /api/vehicles/bookings/64abc123def456789/approval
{
  "action": "approve"
}
// OR
{
  "action": "deny",
  "reason": "Vehicle needs maintenance"
}
```

### 4. Pickup Verification

```javascript
// Vehicle handover with verification code
POST /api/vehicles/bookings/64abc123def456789/pickup
{
  "verificationCode": "1234",
  "vehicleCondition": "excellent",
  "accessoriesChecked": {
    "helmet": true,
    "toolkit": true,
    "spareTyre": true
  }
}
```

## Frontend Integration

### Booking Status Display

```javascript
// Show different UI based on booking status
switch (booking.bookingStatus) {
  case "pending":
    return <PendingPayment booking={booking} />;
  case "awaiting_approval":
    return <AwaitingApproval booking={booking} />;
  case "confirmed":
    return <ConfirmedBooking booking={booking} />;
  case "ongoing":
    return <OngoingRental booking={booking} />;
  case "completed":
    return <CompletedBooking booking={booking} />;
}
```

### Seller Dashboard

```javascript
// Show bookings requiring approval
const pendingApprovals = bookings.filter(
  (b) => b.bookingStatus === "awaiting_approval"
);

// Approval actions
const handleApproval = (bookingId, action, reason) => {
  updateBookingStatus(bookingId, { action, reason });
};
```

## Database Queries

### Get Bookings Requiring Approval

```javascript
const pendingBookings = await VehicleBooking.find({
  vehicleId: { $in: sellerVehicleIds },
  bookingStatus: "awaiting_approval",
}).populate("userId vehicleId");
```

### Check Vehicle Approval Requirement

```javascript
const vehicle = await Vehicle.findById(vehicleId);
const requiresApproval = vehicle.requireConfirmation;
```

This system provides a complete, secure vehicle rental booking flow with proper approval mechanisms and verification processes.
