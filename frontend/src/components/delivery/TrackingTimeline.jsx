import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  ChefHat,
  ShoppingCart,
  CreditCard
} from 'lucide-react';

const TrackingTimeline = ({ timeline = [] }) => {
  const getStatusIcon = (status) => {
    const iconClass = "h-4 w-4";
    
    switch (status.toLowerCase()) {
      case 'order_placed':
        return <ShoppingCart className={iconClass} />;
      case 'payment_confirmed':
        return <CreditCard className={iconClass} />;
      case 'preparing':
        return <ChefHat className={iconClass} />;
      case 'ready_for_pickup':
        return <Package className={iconClass} />;
      case 'picked_up':
        return <Truck className={iconClass} />;
      case 'out_for_delivery':
        return <Truck className={iconClass} />;
      case 'delivered':
        return <MapPin className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getStatusColor = (status, isCompleted) => {
    if (isCompleted) {
      return 'bg-green-500 text-white';
    }
    
    switch (status.toLowerCase()) {
      case 'preparing':
        return 'bg-yellow-500 text-white';
      case 'out_for_delivery':
        return 'bg-blue-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  const getStatusTitle = (status) => {
    const titles = {
      'order_placed': 'Order Placed',
      'payment_confirmed': 'Payment Confirmed',
      'preparing': 'Preparing Your Order',
      'ready_for_pickup': 'Ready for Pickup',
      'picked_up': 'Picked Up',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };
    
    return titles[status.toLowerCase()] || status.replace('_', ' ').toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
      
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start"
          >
            {/* Timeline Line */}
            {index < timeline.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-12 bg-gray-200"></div>
            )}
            
            {/* Status Icon */}
            <div className={`
              relative z-10 flex items-center justify-center w-8 h-8 rounded-full
              ${getStatusColor(item.status, item.completed)}
              ${item.completed ? 'ring-2 ring-green-200' : ''}
            `}>
              {item.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                getStatusIcon(item.status)
              )}
            </div>
            
            {/* Status Content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`
                  text-sm font-medium
                  ${item.completed ? 'text-gray-900' : 'text-gray-600'}
                `}>
                  {getStatusTitle(item.status)}
                </h4>
                <span className="text-xs text-gray-500">
                  {formatTime(item.timestamp)}
                </span>
              </div>
              
              {item.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.description}
                </p>
              )}
              
              {item.location && (
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {item.location}
                </p>
              )}
              
              {item.estimatedTime && !item.completed && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  ETA: {item.estimatedTime}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {timeline.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tracking information available yet</p>
        </div>
      )}
    </div>
  );
};

export default TrackingTimeline;
