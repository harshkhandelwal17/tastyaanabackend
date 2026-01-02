import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ZomatoStyleTrackingMap from './ZomatoStyleTrackingMap';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="h-96 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center p-4">
      <h2 className="text-red-800 font-semibold mb-2">Component Error</h2>
      <p className="text-red-600 text-sm mb-4">{error.message}</p>
      <button onClick={resetErrorBoundary} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Retry
      </button>
    </div>
  </div>
);

const PolylineTestComponent = () => {
  // Exact test data from debug panel
  const testData = {
    orderId: '68a2cd5ead236c5d9b1607cb',
    deliveryAddress: {
      coordinates: { lat: 22.7241, lng: 75.8630 },
      street: 'm 8, Usha Pathak, New Siyaganj, Indore, Madhya Pradesh 452016, India',
      city: 'Indore',
      state: 'Madhya Pradesh'
    },
    driverLocation: { lat: 22.7638, lng: 75.8858 },
    driver: {
      name: 'Test Driver',
      phone: '+91 9876543210',
      rating: 4.5,
      vehicle: { type: 'bike', number: 'MP 09 XX 1234' }
    },
    estimatedTime: '15-20 min',
    status: 'out_for_delivery',
    isConnected: true
  };

  return (
    <div className="h-screen w-full bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-semibold">Polyline Visibility Test</h1>
        <p className="text-blue-100 text-sm mt-1">
          Testing route lines visibility with direct Google Maps API integration
        </p>
      </div>

      {/* Map Container */}
      <div className="h-full relative">
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <ZomatoStyleTrackingMap
            orderId={testData.orderId}
            deliveryAddress={testData.deliveryAddress}
            driverLocation={testData.driverLocation}
            driver={testData.driver}
            estimatedTime={testData.estimatedTime}
            status={testData.status}
            isConnected={testData.isConnected}
          />
        </ErrorBoundary>

        {/* Instructions Overlay */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50">
          <h3 className="font-semibold text-gray-900 mb-2">🔍 What to Look For:</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-blue-500 rounded"></div>
              <span>Blue route line (Directions API)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-orange-500 rounded"></div>
              <span>Orange direct line (Fallback)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Green bike icon (Driver)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-4 bg-red-500 rounded-t-full"></div>
              <span>Red pin (Delivery)</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-gray-600">
            <div>Driver: {testData.driverLocation.lat.toFixed(4)}, {testData.driverLocation.lng.toFixed(4)}</div>
            <div>Delivery: {testData.deliveryAddress.coordinates.lat.toFixed(4)}, {testData.deliveryAddress.coordinates.lng.toFixed(4)}</div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Expected: Route lines should be visible on the map
            </div>
            <div className="text-sm font-medium text-green-600">
              ✅ Direct Google Maps API integration active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolylineTestComponent;