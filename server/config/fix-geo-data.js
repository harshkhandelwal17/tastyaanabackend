const fs = require('fs');
const path = require('path');

// Read the JSON file
const filePath = path.join(__dirname, 'Rideyourbike.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Default coordinates for different zones in Indore
const zoneCoordinates = {
  'ind003': [75.8577, 22.7196], // Indrapuri/Bhawar Kua Square area
  'vn001': [75.8648, 22.7532],  // Vijay Nagar area
  'default': [75.8577, 22.7196] // Default Indore coordinates
};

// Function to get coordinates based on zone code or location
function getCoordinatesForVehicle(vehicle) {
  // Try to match by zone code first
  if (vehicle.zoneCode && zoneCoordinates[vehicle.zoneCode]) {
    return zoneCoordinates[vehicle.zoneCode];
  }
  
  // Try to match by zone center name
  if (vehicle.zoneCenterName) {
    const name = vehicle.zoneCenterName.toLowerCase();
    if (name.includes('vijay nagar') || name.includes('vijaynagar')) {
      return zoneCoordinates['vn001'];
    }
    if (name.includes('indrapuri') || name.includes('bhawar kua')) {
      return zoneCoordinates['ind003'];
    }
  }
  
  // Default coordinates
  return zoneCoordinates['default'];
}

// Fix all vehicles
let fixedCount = 0;
data.forEach(vehicle => {
  if (vehicle.locationGeo && vehicle.locationGeo.coordinates === null) {
    vehicle.locationGeo.coordinates = getCoordinatesForVehicle(vehicle);
    fixedCount++;
  }
});

// Write the fixed data back to file
fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

console.log(`Fixed ${fixedCount} vehicles with null coordinates`);
console.log('All locationGeo.coordinates have been updated with proper [longitude, latitude] values');