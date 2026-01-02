import React from 'react';
import ZomatoStyleTrackingMap from './ZomatoStyleTrackingMap';
import DriverMap from './DriverMap';

const MapTestComponent = () => {
  // Test data matching your debug panel output
  const testOrderId = '68a2cd5ead236c5d9b1607cb';
  const testDriverLocation = { lat: 22.7638, lng: 75.8858 };
  const testDeliveryAddress = {
    coordinates: { lat: 22.7241, lng: 75.8630 },
    street: 'm 8, Usha Pathak, New Siyaganj, Indore, Madhya Pradesh 452016, India',
    city: 'Indore',
    state: 'Madhya Pradesh'
  };
  
  const testDriver = {
    name: 'Test Driver',
    phone: '+91 9876543210',
    rating: 4.5,
    vehicle: {
      type: 'bike',
      number: 'MP 09 XX 1234'
    }
  };

  const testOrder = {
    _id: testOrderId,
    orderNumber: 'TEST001',
    totalAmount: 299,
    paymentStatus: 'paid',
    status: 'out_for_delivery',
    items: [{ name: 'Test Item' }],
    userContactNo: '+91 9876543210',
    deliveryAddress: testDeliveryAddress
  };

  const handleStatusUpdate = (status, description) => {
    console.log('Status update:', status, description);
  };

  const handleLocationUpdate = (location) => {
    console.log('Location update:', location);
  };

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* ZomatoStyleTrackingMap Test */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="h-8 bg-blue-500 text-white text-sm font-medium flex items-center px-3">
            ZomatoStyleTracking Test
          </div>
          <div className="h-[calc(100%-2rem)]">
            <ZomatoStyleTrackingMap
              orderId={testOrderId}
              deliveryAddress={testDeliveryAddress}
              driverLocation={testDriverLocation}
              driver={testDriver}
              estimatedTime="15-20 min"
              status="out_for_delivery"
              isConnected={true}
            />
          </div>
        </div>

        {/* DriverMap Test */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="h-8 bg-green-500 text-white text-sm font-medium flex items-center px-3">
            DriverMap Test
          </div>
          <div className="h-[calc(100%-2rem)]">
            <DriverMap
              order={testOrder}
              onStatusUpdate={handleStatusUpdate}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </div>
      </div>

      {/* Status Panel */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-50">
        <h3 className="font-medium text-gray-900 mb-2">Test Status</h3>
        <div className="text-sm space-y-1">
          <div>Driver: {testDriverLocation.lat.toFixed(4)}, {testDriverLocation.lng.toFixed(4)}</div>
          <div>Delivery: {testDeliveryAddress.coordinates.lat.toFixed(4)}, {testDeliveryAddress.coordinates.lng.toFixed(4)}</div>
          <div>Order ID: {testOrderId}</div>
          <div className="text-green-600">✅ Fixed Issues:</div>
          <div className="text-xs text-gray-600 ml-4">
            • Socket connections improved<br/>
            • Map instance initialization fixed<br/>
            • Directions service setup enhanced<br/>
            • Real-time location sync enabled<br/>
            • Route calculation optimized
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTestComponent;