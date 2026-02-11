# Vehicle Data Migration Guide

This guide explains how to convert the existing vehicle rental data from JSON format to the new MongoDB schema format.

## Files Created

### 1. Enhanced Vehicle Schema (`server/models/VehicleEnhanced.js`)

- Complete mongoose schema based on your specified format
- Includes all required fields from the original request
- Added missing important fields with appropriate defaults
- Maps the old JSON structure to new schema structure

### 2. Migration Script (`server/scripts/migrateVehicleData.js`)

- Converts `vehicleRentaldata.json` to new schema format
- Handles data type conversions and field mappings
- Provides validation and error handling

## Field Mappings

The migration script maps fields from the old JSON structure to the new schema:

| Old Field         | New Field                       | Notes                                   |
| ----------------- | ------------------------------- | --------------------------------------- |
| `name`            | `name`                          | Direct mapping                          |
| `company`         | `companyName`                   | Mapped to enum values, 'Jawa' → 'Other' |
| `center.fullName` | `zoneCenterName`                | Zone center information                 |
| `center.address`  | `zoneCenterAddress`             | Zone address                            |
| `center.code`     | `zoneCode`                      | Zone code for indexing                  |
| `number`          | `vehicleNo`                     | Vehicle registration number             |
| `meter`           | `meterReading`                  | Odometer reading                        |
| `image`           | `vehicleImages`                 | Array of image paths                    |
| `rateTw`          | `rate12hr.baseRate`             | 12-hour base rate                       |
| `limitTw`         | `rate12hr.kmLimit`              | 12-hour km limit                        |
| `extraTw`         | `rate12hr.extraChargePerKm`     | Extra per km charge                     |
| `availTw`         | `rate12hr.extraChargePerHour`   | Extra hourly charge                     |
| `rateTf`          | `rate24hr.baseRate`             | 24-hour base rate                       |
| `limitTf`         | `rate24hr.kmLimit`              | 24-hour km limit                        |
| `extraTf`         | `rate24hr.extraChargePerKm`     | 24-hour extra per km                    |
| `availTf`         | `rate24hr.extraChargePerHour`   | 24-hour extra hourly                    |
| `rateWf`          | `rateHourly.ratePerHour`        | Hourly rate with fuel                   |
| `rateWtf`         | `rateHourly.withoutFuelPerHour` | Hourly rate without fuel                |
| `limitWtf`        | `rateHourly.kmFreePerHour`      | Free km per hour                        |
| `rsprkmWf`        | `rateHourly.extraChargePerKm`   | Hourly extra per km                     |
| `rateDw`          | `rateDaily[0].rate`             | Daily rate                              |
| `limitDw`         | `rateDaily[0].kmLimit`          | Daily km limit                          |
| `extraDw`         | `rateDaily[0].extraChargePerKm` | Daily extra per km                      |

## Added Missing Important Fields

The new schema includes important fields that were missing from the original data:

- **Vehicle Type**: Default 'Petrol' (can be updated later)
- **Category**: Auto-determined based on vehicle name (bike/scooty/car)
- **Vehicle Features**: Empty array (can be populated later)
- **Maintenance Records**: Default maintenance record added
- **Documents**: All set to 'pending' status
- **Analytics**: Initialized with zero values
- **Damage Reports**: Empty array for future use
- **Financial Details**: Default deposit (₹2000) and payment percentage (50%)
- **Location Data**: GeoJSON structure for location-based queries
- **Status Management**: Enhanced status and availability tracking

## Usage Instructions

### 1. Run Data Conversion Only

```bash
cd server
node scripts/migrateVehicleData.js
```

This will create:

- `config/convertedVehicleData.json` - Full conversion result
- `config/vehiclesForImport.json` - Array of vehicles ready for MongoDB import

### 2. Run Full Database Migration

Edit `scripts/migrateVehicleData.js` and uncomment the database migration section:

```javascript
// Uncomment these lines at the bottom of the file:
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/onlinestore";
migrateToDatabase(mongoUri).then((result) => {
  if (result.success) {
    console.log(
      `🎉 Migration completed successfully! ${result.migrated} vehicles migrated.`
    );
  } else {
    console.log(`💥 Migration failed: ${result.error}`);
  }
  process.exit(0);
});
```

Then run:

```bash
cd server
node scripts/migrateVehicleData.js
```

### 3. Use in Your Application

```javascript
const Vehicle = require("./models/VehicleEnhanced");

// Example usage
const vehicles = await Vehicle.findAvailableVehicles("bike", "ind003");
const nearbyVehicles = await Vehicle.findNearby(75.8577, 22.7196, 5000); // 5km radius
const rateCalculation = vehicle.calculateRate(12, "12hr", true);
```

## Rate Calculation Examples

The schema includes a comprehensive rate calculation method:

```javascript
// 12-hour booking with fuel
const rate12hr = vehicle.calculateRate(12, "12hr", true);
console.log(rate12hr.total); // Total amount

// Hourly booking for 5 hours
const rateHourly = vehicle.calculateRate(5, "hourly", false);
console.log(rateHourly.breakdown); // Detailed breakdown

// 24-hour booking
const rate24hr = vehicle.calculateRate(24, "24hr", true);
console.log(rate24hr.rateConfig); // Rate configuration used
```

## Important Notes

1. **Seller IDs**: The migration script generates placeholder ObjectIDs for `sellerId`. You'll need to update these with actual user IDs from your User collection.

2. **Location Coordinates**: The `locationGeo` field is prepared but coordinates need to be added for location-based searches.

3. **Vehicle Categories**: Auto-determined based on name patterns. Review and update as needed.

4. **Company Mapping**: 'Jawa' is mapped to 'Other' since it's not in the original enum. Add 'Jawa' to the enum if needed.

5. **Document Status**: All documents are set to 'pending'. Update with actual document URLs/paths.

6. **Validation**: The new schema includes extensive validation. Some old data might need cleanup to pass validation.

## Next Steps

1. Run the migration script to convert your data
2. Review the converted data for accuracy
3. Update seller IDs with actual user references
4. Add location coordinates for geo-queries
5. Update document statuses with real document paths
6. Test the rate calculation methods with your business logic
7. Consider adding indexes for performance optimization

## Schema Enhancements

The new schema provides:

- **Better Performance**: Proper indexing for common queries
- **Data Validation**: Strong validation rules and constraints
- **Business Logic**: Built-in methods for rate calculation and availability
- **Analytics**: Track usage patterns and revenue
- **Maintenance**: Proper maintenance scheduling and tracking
- **Damage Reporting**: Handle vehicle damage reports
- **Flexible Pricing**: Multiple pricing models (hourly, 12hr, 24hr, daily)
