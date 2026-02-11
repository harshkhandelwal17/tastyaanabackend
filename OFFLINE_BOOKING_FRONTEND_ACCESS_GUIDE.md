# 🏪 Offline Booking Frontend Access Guide

## 📍 How to Access Seller Offline Booking System

### 🌐 Frontend Access Points

1. **Main URL Path**:

   ```
   http://localhost:5173/seller/vehicles/offline-booking
   ```

2. **Navigation Menu**:
   - Login as a seller
   - Go to Vehicle Rental Dashboard
   - Click on "**Offline Booking**" in the sidebar menu
   - Located between "Booking Management" and "Billing History"

### 🎯 Direct Integration Steps

#### 1. **Seller Dashboard Navigation**

```javascript
// The offline booking link is now added to:
frontend/src/layout/SellerLayout.jsx

// Navigation item:
{
  name: "Offline Booking",
  href: "/seller/vehicles/offline-booking",
  icon: User,
  current: location.pathname === "/seller/vehicles/offline-booking",
}
```

#### 2. **Route Configuration**

```javascript
// Added to: frontend/src/routes/SellerVehicleRoutes.jsx
<Route path="offline-booking" element={<SellerOfflineBooking />} />
```

#### 3. **Component Location**

```javascript
// Main component:
frontend / src / pages / seller / SellerOfflineBooking.jsx;

// Styling:
frontend / src / pages / seller / SellerOfflineBooking.css;
```

### 🔄 Backend API Endpoints

The frontend connects to these API endpoints:

#### **Main Seller Booking APIs**

```javascript
// Base URL: /api/seller/bookings/

POST / api / seller / bookings / create - offline; // Create offline booking
GET / api / seller / bookings / available - vehicles; // Get available vehicles
GET / api / seller / bookings / cash - flow - summary; // Get cash flow data
PUT / api / seller / bookings / cash - payment; // Update cash payment
POST / api / seller / bookings / cash - handover; // Mark cash handover
GET / api / seller / bookings; // Get seller bookings
```

### 🎨 Frontend Features Available

#### **📊 Overview Tab**

- Daily booking statistics (online vs offline)
- Cash in hand tracking
- Revenue breakdown
- Quick action buttons

#### **➕ Create Offline Booking Tab**

- Customer information form
- Vehicle selection based on time slot
- Payment collection (cash + online)
- Real-time cost calculation

#### **💰 Cash Flow Tab**

- Date range selection
- Payment method breakdown
- Cash handover management
- Revenue analytics

### 🔧 API Service Functions

The following functions are available in `vehicleRentalApi.js`:

```javascript
// Offline booking functions:
vehicleRentalAPI.createOfflineBooking(bookingData);
vehicleRentalAPI.getAvailableVehiclesForBooking(startTime, endTime, zoneId);
vehicleRentalAPI.getCashFlowSummary(startDate, endDate, zoneId);
vehicleRentalAPI.updateCashPayment(bookingId, paymentData);
vehicleRentalAPI.markCashHandover(handoverData);
vehicleRentalAPI.getZones();
```

### 🚀 Quick Test Access

1. **Start Development Server**:

   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd server
   npm start
   ```

2. **Login as Seller**:

   - Use seller credentials
   - Navigate to Vehicle Rental section

3. **Click "Offline Booking"** in sidebar menu

4. **Test Features**:
   - View overview statistics
   - Create a new offline booking
   - Check cash flow management

### 🎯 Zone-Based Access

The system supports **multiple zones per seller**:

- Select specific zone from dropdown
- Each zone has its own vehicles and bookings
- Cash flow tracking per zone
- Worker assignments per zone

### 💡 Key Features

1. **Walk-in Customer Booking**: Create bookings for customers who visit physically
2. **Cash Flow Tracking**: Track cash collected vs online payments
3. **Multi-Payment Support**: Accept partial cash + online payments
4. **Zone Management**: Filter by specific zones
5. **Real-time Updates**: Live cash flow and booking statistics
6. **Responsive Design**: Works on mobile and desktop

### 🔐 Access Requirements

- User must be logged in as **seller**
- Seller must have vehicle rental access
- Authentication token required for all API calls

---

## 🎉 You Can Now Access Your Offline Booking System!

**Quick Access**: `http://localhost:5173/seller/vehicles/offline-booking`

The system is fully integrated and ready to handle offline bookings with comprehensive cash flow management! 🚗💰
