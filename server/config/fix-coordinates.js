const fs = require('fs');
const path = require('path');

// Define coordinates for different zone centers in Indore
const zoneCoordinates = {
    "ind003": [75.8577, 22.7196], // Indrapuri main office, bhawar kua square
    "ind004": [75.8973, 22.7532], // Vijay nagar square, Indore Vijay nagar
};

const filePath = path.join(__dirname, 'Rideyourbike.json');

try {
    // Read the JSON file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let fixedCount = 0;
    
    // Fix each vehicle's coordinates
    data.forEach((vehicle, index) => {
        if (vehicle.locationGeo && vehicle.locationGeo.coordinates === null) {
            const zoneCode = vehicle.zoneCode;
            
            if (zoneCoordinates[zoneCode]) {
                vehicle.locationGeo.coordinates = zoneCoordinates[zoneCode];
            } else {
                // Default coordinates for Indore if zone not found
                vehicle.locationGeo.coordinates = [75.8577, 22.7196];
            }
            
            console.log(`Fixed vehicle ${index + 1}: ${vehicle.name} - ${vehicle.vehicleNo} in zone: ${zoneCode}`);
            fixedCount++;
        }
    });
    
    // Write the updated JSON back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    
    console.log(`\nCompleted! Fixed ${fixedCount} vehicles with null coordinates.`);
    
} catch (error) {
    console.error('Error fixing coordinates:', error);
}