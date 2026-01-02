import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import RealTimeDriverNotification from '../components/common/RealTimeDriverNotification';
import { useDriverAssignmentSocket } from '../hooks/useDriverAssignmentSocket';
import { useOrderSocket } from '../hooks/useOrderSocket';

const TestDriverAssignment = () => {
  const { user } = useSelector(state => state.auth);
  const [testOrderId, setTestOrderId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  
  // Use the order socket for real-time updates
  const orderSocket = useOrderSocket(user?.id, user?.role || 'user');
  
  // Use the driver assignment socket
  const driverSocket = useDriverAssignmentSocket(user?.id, testOrderId);

  useEffect(() => {
    // Listen for custom driver assignment events
    const handleDriverAssigned = (event) => {
      const assignmentData = event.detail;
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'driver-assignment',
        data: assignmentData,
        timestamp: new Date()
      }]);
    };

    window.addEventListener('driverAssigned', handleDriverAssigned);
    
    return () => {
      window.removeEventListener('driverAssigned', handleDriverAssigned);
    };
  }, []);

  useEffect(() => {
    if (orderSocket.isConnected) {
      setSocketStatus('connected');
    } else {
      setSocketStatus('disconnected');
    }
  }, [orderSocket.isConnected]);

  const simulateDriverAssignment = () => {
    // Simulate a driver assignment event for testing
    const mockAssignmentData = {
      orderId: testOrderId || 'TEST-ORDER-' + Math.random().toString(36).substr(2, 9),
      orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      driver: {
        id: 'driver-' + Math.random().toString(36).substr(2, 9),
        name: 'Rahul Kumar',
        phone: '+91 98765 43210',
        rating: 4.8,
        vehicle: {
          type: 'bike',
          number: 'MP 04 AB 1234'
        },
        currentLocation: {
          lat: 23.2599,
          lng: 77.4126
        }
      },
      status: 'assigned',
      message: 'Rahul Kumar has been assigned to your order',
      timestamp: new Date()
    };

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('driverAssigned', {
      detail: mockAssignmentData
    }));
  };

  const triggerRealDriverAssignment = async () => {
    if (!testOrderId) {
      alert('Please enter a test order ID');
      return;
    }

    try {
      const response = await fetch(`/api/delivery-partners/auto-assign/${testOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceCategory: 'food'
        })
      });

      if (response.ok) {
        alert('Driver assignment requested! Watch for real-time notification...');
      } else {
        throw new Error('Failed to assign driver');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Failed to assign driver. Using simulation instead...');
      simulateDriverAssignment();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Real-time Driver Assignment Notification Component */}
      <RealTimeDriverNotification 
        orderId={testOrderId}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🚗 Real-time Driver Assignment Test
          </h1>
          <p className="text-gray-600">
            Test the real-time driver assignment functionality. When a driver is assigned, 
            you should see a notification without refreshing the page!
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📡 Connection Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                socketStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                Socket: {socketStatus}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                driverSocket.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                Driver Socket: {driverSocket.isConnected ? 'connected' : 'disconnected'}
              </span>
            </div>
          </div>
          {user && (
            <div className="mt-2 text-sm text-gray-600">
              User: {user.name} (ID: {user.id})
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🎮 Test Controls</h2>
          
          <div className="space-y-4">
            {/* Order ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Order ID (optional)
              </label>
              <input
                type="text"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
                placeholder="Enter order ID for testing or leave blank for simulation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={simulateDriverAssignment}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                🎭 Simulate Assignment
              </button>
              
              <button
                onClick={triggerRealDriverAssignment}
                disabled={!testOrderId}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🚀 Real Assignment
              </button>
            </div>
          </div>
        </div>

        {/* Driver Assignment Info */}
        {driverSocket.hasDriverAssigned && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">👨‍🚀 Assigned Driver</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {driverSocket.driverName}</p>
              <p><span className="font-medium">Phone:</span> {driverSocket.driverPhone}</p>
              <p><span className="font-medium">Rating:</span> ⭐ {driverSocket.driverRating}</p>
              <p><span className="font-medium">Vehicle:</span> {driverSocket.driverVehicle?.type}</p>
              <p><span className="font-medium">Status:</span> 
                <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {driverSocket.assignmentStatus}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Notification Log */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Notification Log</h2>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No notifications received yet. Try triggering a driver assignment!
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.slice().reverse().map((notification) => (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      Driver Assignment Notification
                    </span>
                    <span className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p><strong>Order:</strong> {notification.data.orderNumber}</p>
                    <p><strong>Driver:</strong> {notification.data.driver.name}</p>
                    <p><strong>Phone:</strong> {notification.data.driver.phone}</p>
                    <p><strong>Message:</strong> {notification.data.message}</p>
                  </div>
                  
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      ✅ Real-time notification received!
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Make sure your socket connection shows as "connected" above</li>
            <li>Click "Simulate Assignment" to test the notification system</li>
            <li>Or enter a real order ID and click "Real Assignment" to test with actual data</li>
            <li>Watch for the notification popup in the top-right corner</li>
            <li>Notice that NO page refresh is required - it's truly real-time!</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-800">
              <strong>Expected Result:</strong> When admin assigns a driver, users should immediately 
              see a notification popup with driver details without refreshing the page!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDriverAssignment;