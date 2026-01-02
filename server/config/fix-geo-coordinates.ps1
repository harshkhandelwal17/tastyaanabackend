# PowerShell script to fix null coordinates in Rideyourbike.json

$jsonFile = "d:\Products\onlinestore\server\config\Rideyourbike.json"
$content = Get-Content $jsonFile -Raw | ConvertFrom-Json

# Define coordinates for different zone centers in Indore
$zoneCoordinates = @{
    "ind003" = @(75.8577, 22.7196)  # Indrapuri main office, bhawar kua square
    "ind004" = @(75.8973, 22.7532)  # Vijay nagar square, Indore Vijay nagar
}

# Fix each vehicle's coordinates
foreach ($vehicle in $content) {
    if ($vehicle.locationGeo.coordinates -eq $null) {
        $zoneCode = $vehicle.zoneCode
        if ($zoneCoordinates.ContainsKey($zoneCode)) {
            $vehicle.locationGeo.coordinates = $zoneCoordinates[$zoneCode]
            Write-Host "Fixed coordinates for vehicle: $($vehicle.name) - $($vehicle.vehicleNo) in zone: $zoneCode"
        }
        else {
            # Default coordinates for Indore if zone not found
            $vehicle.locationGeo.coordinates = @(75.8577, 22.7196)
            Write-Host "Used default coordinates for vehicle: $($vehicle.name) - $($vehicle.vehicleNo) in zone: $zoneCode"
        }
    }
}

# Save the updated JSON
$content | ConvertTo-Json -Depth 10 | Set-Content $jsonFile

Write-Host "All null coordinates have been fixed!"