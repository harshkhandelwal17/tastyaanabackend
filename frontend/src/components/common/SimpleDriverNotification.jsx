import React, { useState, useEffect } from 'react';

const SimpleDriverNotification = ({ userId, orderId }) => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for driver assignment events
    const handleDriverAssigned = (event) => {
      const assignmentData = event.detail;
      
      // Only show notification if it's for the current order or user
      if (orderId && assignmentData.orderId === orderId) {
        setNotification(assignmentData);
        setIsVisible(true);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 8000);
      }
    };

    // Add event listener for custom driver assignment event
    window.addEventListener('driverAssigned', handleDriverAssigned);

    return () => {
      window.removeEventListener('driverAssigned', handleDriverAssigned);
    };
  }, [orderId, userId]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleViewTracking = () => {
    if (notification?.orderId) {
      // Navigate to tracking page
      window.location.href = `/track-order/${notification.orderId}`;
    }
  };

  if (!notification || !isVisible) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 max-w-sm bg-white shadow-lg rounded-lg border border-green-200 overflow-hidden transform transition-all duration-300 ease-in-out"
      style={{ 
        zIndex: 9999,
        animation: 'slideInFromTop 0.5s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .pulse-animation {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Header */}
      <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 pulse-animation">🚗</span>
          <span className="font-semibold text-sm">Driver Assigned!</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          {/* Driver Avatar */}
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {notification.driver?.name?.charAt(0) || 'D'}
          </div>
          
          {/* Driver Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {notification.driver?.name || 'Driver'}
            </h3>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <span className="flex items-center mr-3">
                ⭐ {notification.driver?.rating || '4.5'}
              </span>
              <span className="flex items-center">
                🏍️ {notification.driver?.vehicle?.type || 'Bike'}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-700 text-sm mb-3">
          {notification.message || `${notification.driver?.name} has been assigned to your order`}
        </p>

        {/* Order Info */}
        <div className="text-xs text-gray-500 mb-3">
          Order #{notification.orderNumber || notification.orderId?.slice(-8)}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewTracking}
            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Track Order
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-green-400 transition-all duration-100 ease-linear"
          style={{
            width: '100%',
            animation: 'progressBar 8s linear forwards'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SimpleDriverNotification;