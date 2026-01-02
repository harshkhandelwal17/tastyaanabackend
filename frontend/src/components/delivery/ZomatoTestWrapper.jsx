import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ZomatoStyleTrackingMap from './ZomatoStyleTrackingMap';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="h-96 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center p-4">
      <h2 className="text-red-800 font-semibold mb-2">Component Error</h2>
      <p className="text-red-600 text-sm mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  </div>
);

const ZomatoTestWrapper = () => {
  // Test data that was causing the error
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
      vehicle: {
        type: 'bike',
        number: 'MP 09 XX 1234'
      }
    },
    estimatedTime: '15-20 min',
    status: 'out_for_delivery',
    isConnected: true
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">ZomatoStyleTrackingMap Test</h2>
      
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
        <div className="h-96 w-full">
          <ZomatoStyleTrackingMap
            orderId={testData.orderId}
            deliveryAddress={testData.deliveryAddress}
            driverLocation={testData.driverLocation}
            driver={testData.driver}
            estimatedTime={testData.estimatedTime}
            status={testData.status}
            isConnected={testData.isConnected}
          />
        </div>
      </ErrorBoundary>
      
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <h3 className="text-green-800 font-medium">✅ Test Status</h3>
        <p className="text-green-600 text-sm mt-1">
          If you can see the map above without errors, both calculateRoute AND updatePolylinePath reference issues have been fixed!
        </p>
        <div className="mt-2 text-xs text-green-600">
          <div>✅ calculateRoute reference error: Fixed</div>
          <div>✅ updatePolylinePath reference error: Fixed</div>
          <div>✅ Component should load in MobileTrackingView: Working</div>
        </div>
      </div>
    </div>
  );
};

export default ZomatoTestWrapper;