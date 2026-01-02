const fs = require('fs');
const path = require('path');

// Read the current data
const filePath = path.join(__dirname, 'Rideyourbike.json');
const vehicles = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Updating ${vehicles.length} vehicle entries...`);

// Update each vehicle entry
const updatedVehicles = vehicles.map((vehicle, index) => {
  // Convert vehicleImages from string to array if it's a string
  if (typeof vehicle.vehicleImages === 'string') {
    vehicle.vehicleImages = [vehicle.vehicleImages];
  }

  // Add sittingCapacity if it doesn't exist
  if (!vehicle.sittingCapacity) {
    // Set capacity based on category
    switch (vehicle.category) {
      case 'car':
        vehicle.sittingCapacity = 5; // Most cars seat 5
        break;
      case 'bus':
        vehicle.sittingCapacity = 30; // Buses can seat many
        break;
      case 'truck':
        vehicle.sittingCapacity = 3; // Driver + 2 passengers typically
        break;
      case 'bike':
      case 'scooty':
      default:
        vehicle.sittingCapacity = 2; // Most bikes/scooters seat 2
        break;
    }
  }

  console.log(`Updated entry ${index + 1}: ${vehicle.name} (Category: ${vehicle.category}, Capacity: ${vehicle.sittingCapacity})`);
  return vehicle;
});

// Write the updated data back to file
fs.writeFileSync(filePath, JSON.stringify(updatedVehicles, null, 4));

console.log(`\n✅ Successfully updated ${updatedVehicles.length} vehicle entries!`);
console.log('Changes made:');
console.log('- vehicleImages converted from string to array');
console.log('- sittingCapacity added based on vehicle category');