import React, { useState } from 'react';
import ZomatoStyleTrackingMap from '../components/delivery/ZomatoStyleTrackingMap';
import { useSelector } from 'react-redux';

const TestZomatoMap = () => {
  const { user } = useSelector(state => state.auth);
  const [testOrderId, setTestOrderId] = useState('');
  
  // Mock order data
  const mockOrderData = {
    orderId: testOrderId || 'test-order-12345',
    deliveryAddress: {
      street: '123 Main Street',
      city: 'Indore',
      coordinates: {
        lat: 22.7196,
        lng: 75.8577
      }
    },
    // Initially no driver (finding delivery partner)
    driver: null,
    driverLocation: null,
    estimatedTime: '30-45 minutes',
    status: 'finding', // This should change to 'assigned' when driver is assigned
    orderItems: [
      { name: 'Butter Chicken', quantity: 1, price: 250 },
      { name: 'Naan', quantity: 2, price: 50 }
    ],
    orderTotal: 300
  };

  const testDriverAssignment = async () => {
    try {
      const response = await fetch('/api/test-realtime/test-assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          orderId: testOrderId || 'test-order-12345',
          driverName: 'Rahul Kumar'
        })
      });
      
      const result = await response.json();
      console.log('Test assignment result:', result);
      
      if (result.success) {
        alert('✅ Driver assignment test triggered! Watch the map for real-time updates.');
      } else {
        alert('❌ Test failed: ' + result.message);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('❌ Test failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🗺️ Real-time ZomatoStyleTrackingMap Test
          </h1>
          <p className="text-gray-600">
            Test the real-time driver assignment functionality in the ZomatoStyleTrackingMap component.
            Initially shows "Finding delivery partner...", then updates in real-time when driver is assigned.
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🎮 Test Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Order ID
              </label>
              <input
                type="text"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
                placeholder="Enter order ID or leave blank for default"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testDriverAssignment}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                🚀 Assign Test Driver
              </button>
            </div>
          </div>

          {user && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current User:</strong> {user.name} (ID: {user.id})
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Open browser console to see socket connection logs</li>
            <li>Watch the map below - it should initially show "Finding delivery partner..."</li>
            <li>Click "Assign Test Driver" button above</li>
            <li>Watch for the green notification banner on the map</li>
            <li>Notice the bottom panel changes from "Finding..." to "Rahul Kumar is on the way"</li>
            <li>Check that driver details appear in the info window when you click the driver marker</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-800">
              <strong>Expected Result:</strong> Map updates in real-time showing driver details without page refresh!
            </p>
          </div>
        </div>

        {/* ZomatoStyleTrackingMap Component */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🗺️ Live Tracking Map</h2>
          
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <ZomatoStyleTrackingMap
              orderId={mockOrderData.orderId}
              deliveryAddress={mockOrderData.deliveryAddress}
              driverLocation={mockOrderData.driverLocation}
              driver={mockOrderData.driver}
              estimatedTime={mockOrderData.estimatedTime}
              status={mockOrderData.status}
              isConnected={true}
              orderItems={mockOrderData.orderItems}
              orderTotal={mockOrderData.orderTotal}
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Current Map Status:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Order ID:</strong> {mockOrderData.orderId}</p>
              <p><strong>Status:</strong> {mockOrderData.status}</p>
              <p><strong>Driver:</strong> {mockOrderData.driver ? mockOrderData.driver.name : 'Not assigned'}</p>
              <p><strong>Expected Behavior:</strong> Shows "Finding delivery partner..." until driver is assigned in real-time</p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-900 text-white rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">🔍 Debug Information</h3>
          <p className="text-sm mb-2">Open browser console to see:</p>
          <ul className="text-xs space-y-1 font-mono">
            <li>✅ ZomatoStyleTrackingMap: Socket connected for real-time updates</li>
            <li>📡 ZomatoStyleTrackingMap: Joined user room: user-{user?.id}</li>
            <li>📡 ZomatoStyleTrackingMap: Joined tracking room: tracking-{mockOrderData.orderId}</li>
            <li>🚗 ZomatoStyleTrackingMap: REAL-TIME DRIVER ASSIGNMENT RECEIVED!</li>
            <li>✅ ZomatoStyleTrackingMap: Driver details updated in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestZomatoMap;