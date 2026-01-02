import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DriverAssignmentNotification = ({ userId, orderId }) => {
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
      // Navigate to tracking page - you might want to use your router here
      window.location.href = `/track-order/${notification.orderId}`;
    }
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            duration: 0.5, 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm bg-white shadow-2xl rounded-lg border border-green-200 overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="mr-2"
              >
                🚗
              </motion.div>
              <span className="font-semibold text-sm">Driver Assigned!</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
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
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 8, ease: 'linear' }}
            className="h-1 bg-green-400"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DriverAssignmentNotification;