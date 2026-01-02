import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Star, 
  Truck, 
  Clock, 
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const DeliveryInfo = ({ trackingData }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      'order_placed': {
        color: 'bg-blue-100 text-blue-800',
        icon: <Package className="h-4 w-4" />,
        message: 'Your order has been placed successfully'
      },
      'preparing': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-4 w-4" />,
        message: 'Your order is being prepared'
      },
      'ready_for_pickup': {
        color: 'bg-purple-100 text-purple-800',
        icon: <Package className="h-4 w-4" />,
        message: 'Order is ready for pickup'
      },
      'picked_up': {
        color: 'bg-indigo-100 text-indigo-800',
        icon: <Truck className="h-4 w-4" />,
        message: 'Order has been picked up by driver'
      },
      'out_for_delivery': {
        color: 'bg-blue-100 text-blue-800',
        icon: <Truck className="h-4 w-4" />,
        message: 'Your order is on the way'
      },
      'delivered': {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />,
        message: 'Order delivered successfully'
      },
      'cancelled': {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-4 w-4" />,
        message: 'Order has been cancelled'
      },
      'delayed': {
        color: 'bg-orange-100 text-orange-800',
        icon: <AlertCircle className="h-4 w-4" />,
        message: 'Delivery is delayed'
      }
    };

    return statusMap[status?.toLowerCase()] || {
      color: 'bg-gray-100 text-gray-800',
      icon: <Clock className="h-4 w-4" />,
      message: 'Status unknown'
    };
  };

  const statusInfo = getStatusInfo(trackingData?.status);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
      
      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          p-4 rounded-lg mb-6 flex items-center
          ${statusInfo.color}
        `}
      >
        <div className="mr-3">
          {statusInfo.icon}
        </div>
        <div>
          <p className="font-medium">
            {trackingData?.status?.replace('_', ' ').toUpperCase() || 'Unknown'}
          </p>
          <p className="text-sm opacity-90">
            {statusInfo.message}
          </p>
        </div>
      </motion.div>

      {/* Order Summary */}
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Order Total</span>
          <span className="font-semibold">₹{trackingData?.total || '0'}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Items</span>
          <span className="font-medium">{trackingData?.items?.length || 0}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Payment Method</span>
          <span className="font-medium">{trackingData?.paymentMethod || 'N/A'}</span>
        </div>
        
        {trackingData?.estimatedDeliveryTime && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Estimated Delivery</span>
            <span className="font-medium text-blue-600">
              {trackingData.estimatedDeliveryTime}
            </span>
          </div>
        )}
      </div>

      {/* Driver Information */}
      {trackingData?.driver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Delivery Partner
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                {trackingData.driver.name?.charAt(0) || 'D'}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {trackingData.driver.name || 'Driver'}
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                  <span>{trackingData.driver.rating || '4.5'}</span>
                  <span className="mx-1">•</span>
                  <span>{trackingData.driver.deliveries || '100+'} deliveries</span>
                </div>
              </div>
            </div>
            
            {trackingData.driver.phone && (
              <a
                href={`tel:${trackingData.driver.phone}`}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
          
          {trackingData.driver.vehicle && (
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Truck className="h-3 w-3 mr-1" />
                <span>{trackingData.driver.vehicle.type} - {trackingData.driver.vehicle.number}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Special Instructions */}
      {trackingData?.specialInstructions && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-1">Special Instructions</h5>
          <p className="text-sm text-blue-700">{trackingData.specialInstructions}</p>
        </div>
      )}

      {/* Emergency Contact */}
      <div className="mt-6 p-3 bg-red-50 rounded-lg">
        <h5 className="font-medium text-red-900 mb-2">Need Help?</h5>
        <div className="space-y-2 text-sm">
          <a
            href="tel:+911234567890"
            className="flex items-center text-red-700 hover:text-red-800"
          >
            <Phone className="h-3 w-3 mr-2" />
            Customer Support: +91 12345 67890
          </a>
          <p className="text-red-600">Available 24/7 for delivery assistance</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;
