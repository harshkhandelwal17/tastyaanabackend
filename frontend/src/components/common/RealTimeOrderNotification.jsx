import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, Truck, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const RealTimeOrderNotification = ({ 
  orderUpdates, 
  newOrders, 
  driverAssignments, 
  userRole,
  onClearNotifications 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const allNotifications = [
      ...orderUpdates.map(update => ({
        id: `update-${update.orderId}-${Date.now()}`,
        type: 'order-update',
        title: 'Order Status Updated',
        message: `Order ${update.orderNumber} status: ${update.status}`,
        timestamp: new Date(),
        data: update
      })),
      ...newOrders.map(order => ({
        id: `new-${order.orderId}-${Date.now()}`,
        type: 'new-order',
        title: 'New Order Received',
        message: `New order ${order.orderNumber} received`,
        timestamp: new Date(),
        data: order
      })),
      ...driverAssignments.map(assignment => ({
        id: `assignment-${assignment.orderId}-${Date.now()}`,
        type: 'driver-assignment',
        title: 'Driver Assigned',
        message: `Driver assigned to order ${assignment.orderNumber}`,
        timestamp: new Date(),
        data: assignment
      }))
    ];

    setNotifications(prev => [...prev, ...allNotifications]);
  }, [orderUpdates, newOrders, driverAssignments]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order-update':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'new-order':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'driver-assignment':
        return <Truck className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order-update':
        return 'bg-blue-50 border-blue-200';
      case 'new-order':
        return 'bg-green-50 border-green-200';
      case 'driver-assignment':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (onClearNotifications) {
      onClearNotifications();
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative bg-white rounded-full p-3 shadow-lg border hover:shadow-xl transition-shadow"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="p-2">
            {notifications.slice(-10).reverse().map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border mb-2 ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => clearNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeOrderNotification;

