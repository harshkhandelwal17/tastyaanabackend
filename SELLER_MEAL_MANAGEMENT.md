# Seller Meal Management System

## Overview

Complete meal management system for sellers with "No Meal Today" functionality and user notifications.

## Features Implemented

### 🍽️ Seller Panel - Meal Management

**Route**: `/seller/meal-edit`

**Features**:

- View and manage meal subscriptions
- Meal plan management (tiers, shifts)
- Quick access from seller dashboard
- Real-time subscription overview

**API Endpoints**:

- `GET /api/seller/meal-edit/dashboard` - Meal management dashboard
- `GET /api/seller/meal-edit/meal-templates` - Get meal templates
- `GET /api/seller/meal-edit/meal-plans` - Get seller meal plans

### 📋 Daily Orders View

**Route**: `/seller/meal-edit/daily-orders`

**Features**:

- Date-wise order filtering
- Shift-based grouping (Morning/Evening)
- Order status tracking
- Customer details and delivery addresses
- Export functionality (CSV)
- Real-time stats dashboard

**API Endpoints**:

- `GET /api/seller/meal-edit/daily-orders` - Get daily orders with filtering
- `GET /api/seller/meal-edit/daily-orders/export` - Export orders to CSV

### 🚫 "No Meal Today" Management

#### Seller Side:

**Features**:

- Mark "no meal today" for specific shifts (morning/evening)
- Add optional reason for unavailability
- Quick toggle interface with visual indicators
- Automatic customer notifications

**API Endpoints**:

- `POST /api/seller/meal-edit/no-meal-today` - Mark no meal for shift
- `DELETE /api/seller/meal-edit/no-meal-today` - Remove no meal status
- `GET /api/seller/meal-edit/no-meal-today` - Check current no meal status

#### User Side:

**Features**:

- Automatic notifications on subscription page
- Clear messaging about meal unavailability
- Reason display (if provided by seller)
- Dismissible notifications

**API Endpoints**:

- `GET /api/subscriptions/check-no-meal-today` - Check if any subscriptions have no meal today

## Database Schema Updates

### DailyMeal Model Enhanced

```javascript
{
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shift: { type: String, enum: ['morning', 'evening'] },
  noMealAvailable: { type: Boolean, default: false },
  noMealReason: { type: String },
  // ... existing fields
}

// New compound index for efficient queries
{ seller: 1, date: 1, shift: 1 }
```

## Frontend Components

### Seller Components:

1. **SellerMealEdit.jsx** - Main meal management interface
2. **SellerDailyOrders.jsx** - Daily orders view with filtering
3. **SellerDashboardHome.jsx** - Updated with quick action cards

### User Components:

1. **NoMealTodayAlert.jsx** - Notification component for users
2. **UserSubscriptionPage.jsx** - Enhanced with meal availability alerts

## Navigation Structure

### Seller Dashboard Quick Actions:

- **Meal Management** → `/seller/meal-edit`
- **Daily Orders** → `/seller/meal-edit/daily-orders`

### Seller Routes Updated:

```javascript
// New routes added to SellerRoutes.jsx
<Route path="/meal-edit" element={<SellerMealEdit />} />
<Route path="/meal-edit/daily-orders" element={<SellerDailyOrders />} />
```

## Technical Implementation

### Backend Architecture:

1. **Routes**: `server/routes/sellerMealRoutes.js`
2. **Controller**: `server/controllers/sellerMealController.js`
3. **Model Updates**: Enhanced `DailyMeal.js` schema
4. **Integration**: Added to main seller routes and subscription routes

### Frontend Architecture:

1. **Pages**: Seller meal edit and daily orders pages
2. **Components**: User notification system
3. **Routing**: Integrated with existing seller panel navigation
4. **API Integration**: REST API calls with authentication

### Authentication & Authorization:

- All routes protected with `authenticate` middleware
- Seller-specific routes use `authorize(['seller', 'admin'])`
- User notification endpoints use standard user authentication

## Usage Instructions

### For Sellers:

1. Access **Meal Management** from dashboard quick actions
2. Toggle "No Meal Today" for specific shifts
3. Add optional reason for unavailability
4. View daily orders with filtering options
5. Export order data as needed

### For Users:

1. Visit subscription page to see meal availability
2. Receive automatic notifications when sellers mark "no meal today"
3. View reason for unavailability (if provided)
4. Plan alternative meal arrangements

## Environment Variables

No additional environment variables required - uses existing backend URL configuration.

## Testing the Implementation

### Seller Flow:

1. Login as seller → Dashboard → Meal Management
2. Toggle "No Meal Today" for a shift
3. Check Daily Orders view
4. Verify notifications are created

### User Flow:

1. Login as user with active subscription
2. Visit subscription page
3. Check for "No Meal Today" notifications
4. Verify seller information and reasons are displayed

## Next Steps (Optional Enhancements)

1. Email notifications for "no meal today" alerts
2. Bulk meal management for multiple days
3. Advanced filtering and search in daily orders
4. Mobile-responsive improvements
5. Push notifications for real-time alerts

---

## Technical Notes

- Uses Indian timezone (IST) for date handling
- Implements proper error handling and loading states
- Follows existing code patterns and styling
- Fully integrated with existing authentication system
