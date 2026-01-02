# Vehicle Rental Sellers Mock Data

This directory contains comprehensive mock data for vehicle rental sellers with service zones in **Bholaram Ustad Marg**, **Vijaynagar**, and **Indrapuri**.

## 📋 Overview

The mock data includes **4 vehicle rental sellers** with the following distribution:

### 🏢 Sellers by Zone:

1. **Bholaram Ustad Marg** (2 sellers)
   - **Bholaram Wheels** (Individual: 45 vehicles, 4.5⭐)
   - **Premium Auto Hub** (Multi-zone: 65 vehicles, 4.8⭐)

2. **Vijaynagar** (2 sellers)
   - **Vijaynagar Auto Rentals** (Agency: 32 vehicles, 4.2⭐)
   - **Premium Auto Hub** (Multi-zone: 65 vehicles, 4.8⭐)

3. **Indrapuri** (1 seller)
   - **Indrapuri Speed Rentals** (Individual: 28 vehicles, 4.7⭐)

### 📊 Summary Statistics:

- **Total Sellers**: 4
- **Total Vehicles**: 170
- **Average Rating**: 4.55⭐
- **Business Types**: Individual, Fleet Owner, Agency, Franchise
- **Zones Covered**: 3 main zones

## 🚀 Usage

### Method 1: Database Seeding (Recommended)

```bash
# Seed all vehicle rental sellers
npm run seed:vehicle-sellers

# Clean existing and seed fresh data
npm run seed:vehicle-sellers:clean

# Or run directly
node scripts/seedVehicleRentalSellers.js
```

### Method 2: API Seeding

```bash
# POST request to seed via API
curl -X POST http://localhost:5000/api/test/seed-vehicle-sellers

# Force overwrite existing data
curl -X POST http://localhost:5000/api/test/seed-vehicle-sellers \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

## 🔍 Testing & Verification

### API Endpoints for Testing

1. **Get All Vehicle Sellers**

   ```
   GET /api/test/vehicle-sellers
   ```

2. **Get Sellers by Zone**

   ```
   GET /api/test/vehicle-sellers/by-zone/bholaram
   GET /api/test/vehicle-sellers/by-zone/vijaynagar
   GET /api/test/vehicle-sellers/by-zone/indrapuri
   ```

3. **Get Zone Statistics**
   ```
   GET /api/test/zones/statistics
   ```

### Example API Responses

#### All Sellers Response:

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "...",
      "name": "Rajesh Kumar",
      "storeName": "Bholaram Wheels",
      "rating": { "average": 4.5, "count": 127 },
      "zones": [
        {
          "name": "Bholaram Ustad Marg",
          "code": "BUM001",
          "coordinates": { "lat": 22.7196, "lng": 75.8577 }
        }
      ],
      "fleetStats": {
        "totalVehicles": 45,
        "activeVehicles": 42,
        "vehicleCategories": {
          "bikes": 18,
          "cars": 12,
          "scooties": 15
        }
      }
    }
  ]
}
```

#### Zone Statistics Response:

```json
{
  "success": true,
  "data": {
    "Bholaram Ustad Marg": {
      "sellers": 2,
      "totalVehicles": 110,
      "activeVehicles": 104,
      "avgRating": "4.7"
    },
    "Vijaynagar": {
      "sellers": 2,
      "totalVehicles": 97,
      "activeVehicles": 92,
      "avgRating": "4.5"
    },
    "Indrapuri": {
      "sellers": 1,
      "totalVehicles": 28,
      "activeVehicles": 26,
      "avgRating": "4.7"
    }
  }
}
```

## 📁 File Structure

```
server/
├── mockData/
│   └── vehicleRentalSellers.js      # Mock data definitions
├── scripts/
│   └── seedVehicleRentalSellers.js  # Seeding script
├── routes/
│   └── testRoutes.js                # API endpoints for testing
└── README_VEHICLE_SELLERS.md        # This file
```

## 🛠️ Data Structure

Each seller includes:

### Core Information

- Name, email, phone, role (seller)
- Verification status and ratings

### Store Profile

- Store name, description, address
- Operating hours for all days
- Store status (open/closed)

### Vehicle Rental Service

- **Service Status**: active/inactive
- **Business Type**: individual/fleet_owner/agency/franchise
- **Service Zones**: Complete zone information with coordinates
- **Fleet Statistics**: Total and active vehicles by category
- **Business Settings**: Booking policies, cancellation terms
- **Financial Settings**: Commission rates, payment terms
- **Documents**: All required business documents
- **Metrics**: Bookings, revenue, ratings, peak hours
- **Staff Members**: Team with roles and permissions

### Vehicle Categories

- **Bikes**: Traditional motorcycles
- **Cars**: 4-wheeler vehicles
- **Scooties**: Scooters and electric scooters
- **Buses**: Larger passenger vehicles
- **Trucks**: Commercial vehicles

## 🧪 Test Scenarios

### 1. Zone-based Filtering

```javascript
// Test fetching sellers from specific zones
const bholaramSellers = await fetch(
  "/api/test/vehicle-sellers/by-zone/bholaram"
);
const vijayngarSellers = await fetch(
  "/api/test/vehicle-sellers/by-zone/vijaynagar"
);
const indrapuriSellers = await fetch(
  "/api/test/vehicle-sellers/by-zone/indrapuri"
);
```

### 2. Multi-zone Seller

```javascript
// Premium Auto Hub operates in both Bholaram and Vijaynagar
// Test that it appears in both zone searches
```

### 3. Fleet Statistics

```javascript
// Verify total vehicles across all sellers
// Check active vs total vehicle counts
// Validate vehicle category distributions
```

### 4. Business Metrics

```javascript
// Test average ratings calculation
// Verify booking counts and revenue data
// Check peak hours distribution
```

## 🎯 Login Credentials

All sellers use the same password for testing: `password123`

### Seller Login Details:

1. **Bholaram Wheels**
   - Email: `rajesh.bholaram@vehicles.com`
   - Password: `password123`

2. **Vijaynagar Auto Rentals**
   - Email: `priya.vijaynagar@vehicles.com`
   - Password: `password123`

3. **Indrapuri Speed Rentals**
   - Email: `vikram.indrapuri@vehicles.com`
   - Password: `password123`

4. **Premium Auto Hub**
   - Email: `anjali.premium@vehicles.com`
   - Password: `password123`

## 🔧 Customization

### Adding New Zones

```javascript
// In vehicleRentalSellers.js, add new zones to serviceZones array:
{
  zoneName: "New Zone Name",
  zoneCode: "NZN001",
  address: "Complete address",
  coordinates: { lat: 22.xxxx, lng: 75.xxxx },
  // ... other zone properties
}
```

### Modifying Fleet Data

```javascript
// Update fleetStats for any seller:
fleetStats: {
  totalVehicles: 50,
  activeVehicles: 47,
  vehicleCategories: {
    bikes: 20,
    cars: 15,
    scooties: 15,
    buses: 0,
    trucks: 0
  }
}
```

## 📞 Support

For issues or questions regarding the mock data:

1. Check the seeding script logs for detailed output
2. Use the test API endpoints to verify data integrity
3. Review the User model schema for field requirements
4. Check console output for validation errors

---

**Happy Testing!** 🚗⚡
