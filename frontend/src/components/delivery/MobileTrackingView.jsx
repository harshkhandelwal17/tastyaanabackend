import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Clock, 
  User, 
  Star,
  Expand,
  Minimize,
  Package,
  Truck,
  CheckCircle,
  Wifi,
  WifiOff,
  Zap,
  CreditCard
} from 'lucide-react';
import ZomatoStyleTrackingMap from './ZomatoStyleTrackingMap';

const MobileTrackingView = ({ 
  order, 
  orderId, 
  driverLocation, 
  driver, 
  estimatedTime, 
  status: trackingStatus, 
  timeline, 
  isConnected, 
  statusInfo 
}) => {
  const navigate = useNavigate();
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const callDriver = () => {
    if (driver?.phone && driver.phone !== 'Will be assigned soon') {
      window.open(`tel:${driver.phone}`);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/orders')}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Track Order
                </h1>
                <p className="text-sm text-gray-500">#{order.orderNumber || orderId?.slice(-8) || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          {/* Status Banner */}
          {statusInfo && (
            <div className="mt-3 flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">{statusInfo.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">{statusInfo.text}</p>
                </div>
              </div>
              {driver && driver.name && driver.name !== 'Finding delivery partner...' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Section - Expandable */}
      <div className={`relative bg-white ${isMapExpanded ? 'h-screen' : 'h-96'} transition-all duration-300`}>
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
          >
            {isMapExpanded ? (
              <Minimize className="w-5 h-5 text-gray-700" />
            ) : (
              <Expand className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
        
        <ZomatoStyleTrackingMap 
          orderId={orderId}
          deliveryAddress={order?.deliveryAddress}
          driverLocation={driverLocation}
          driver={driver}
          estimatedTime={estimatedTime}
          status={trackingStatus}
          isConnected={isConnected}
        />
      </div>

      {/* Content - Hidden when map is expanded */}
      {!isMapExpanded && (
        <div className="p-4 space-y-4">
          {/* Advertisement Card */}
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Get 20% off on your next order!</h3>
                <p className="text-xs opacity-90 mt-1">Use code: TRACK20 (Limited Offer)</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* ETA and Driver Info Card */}
        
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* ETA Section */}
              {/* <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Estimated Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {estimatedTime || 'Calculating...'}
                </p>
              </div> */}

              {/* Driver Section */}
              <div className="text-center border-l border-gray-200 pl-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  {driver && driver.name && driver.name !== 'Finding delivery partner...' ? (
                    <User className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Delivery Partner</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {driver && driver.name ? driver.name : 'Finding...'}
                </p>
              </div>
            </div>
          </div>  
          

          {/* Driver Details Card */}
          {driver && driver.name && driver.name !== 'Finding delivery partner...' && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{driver.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {driver.rating && (
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{driver.rating}</span>
                      </div>
                    )}
                    {driver.vehicle && (
                      <>
                        <span>•</span>
                        <span>{driver.vehicle.type}</span>
                        <span>•</span>
                        <span>{driver.vehicle.number}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
              
              {driver.phone && driver.phone !== 'Will be assigned soon' && (
                <button
                  onClick={callDriver}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </button>
              )}
            </div>
          )}

          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2 text-gray-600" />
              Order Details
            </h3>
            
            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
              {order.items?.length > 3 && (
                <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
              )}
            </div>
            
            {/* Total */}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-lg text-green-600">₹{order.totalAmount || order.total}</span>
            </div>
            
            {/* Delivery Address */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Delivery Address</p>
                  <p>{order.deliveryAddress?.street}</p>
                  <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-gray-600" />
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className={`font-medium ${
                  order.paymentMethod === 'COD' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 
                   order.paymentMethod === 'online' ? 'Online Payment' :
                   order.paymentMethod === 'razorpay' ? 'Online Payment' :
                   order.paymentMethod === 'card' ? 'Card Payment' :
                   order.paymentMethod === 'wallet' ? 'Wallet Payment' :
                   order.paymentMethod === 'subscription' ? 'Subscription Payment' :
                   order.paymentMethod?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'text-green-600' :
                  order.paymentStatus === 'pending' ? 'text-orange-600' :
                  order.paymentStatus === 'failed' ? 'text-red-600' :
                  order.paymentStatus === 'refunded' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'Paid' :
                   order.paymentStatus === 'pending' ? 'Pending' :
                   order.paymentStatus === 'failed' ? 'Failed' :
                   order.paymentStatus === 'refunded' ? 'Refunded' :
                   order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'N/A'}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-700">{order.transactionId}</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid On:</span>
                  <span className="text-gray-700">{new Date(order.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-gray-600" />
              Order Timeline
            </h3>
            <div className="space-y-3">
              {timeline && timeline.length > 0 ? (
                timeline.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-4 h-4 rounded-full mt-0.5 mr-3 flex items-center justify-center ${
                      item.completed ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                      {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        item.completed ? 'font-medium text-gray-900' : 'text-gray-500'
                      }`}>
                        {item.description || item.status?.replace('_', ' ')}
                      </p>
                      {item.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  {/* Order Placed */}
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Order Placed</p>
                      <p className="text-xs text-gray-500">We've received your order</p>
                    </div>
                  </div>
                  
                  {/* Order Confirmed */}
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      ['payment_confirmed', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                        ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        ['payment_confirmed', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                          ? 'text-gray-900' : 'text-gray-500'
                      }`}>Order Confirmed</p>
                      <p className="text-xs text-gray-500">Payment received, preparing your order</p>
                    </div>
                  </div>

                  {/* Preparing */}
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      ['preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                        ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        ['preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                          ? 'text-gray-900' : 'text-gray-500'
                      }`}>Preparing Your Order</p>
                      <p className="text-xs text-gray-500">Kitchen is preparing your delicious food</p>
                    </div>
                  </div>

                  {/* Driver Assigned */}
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      ['assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                        ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        ['assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                          ? 'text-gray-900' : 'text-gray-500'
                      }`}>Delivery Partner Assigned</p>
                      <p className="text-xs text-gray-500">
                        {driver && driver.name && driver.name !== 'Finding delivery partner...' 
                          ? `${driver.name} will deliver your order` 
                          : 'Finding the best delivery partner for you'}
                      </p>
                    </div>
                  </div>

                  {/* Out for Delivery */}
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      ['picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                        ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        ['picked_up', 'out_for_delivery', 'reached', 'delivered'].includes(trackingStatus) 
                          ? 'text-gray-900' : 'text-gray-500'
                      }`}>On the Way</p>
                      <p className="text-xs text-gray-500">Your order is being delivered</p>
                    </div>
                  </div>

                  {/* Delivered */}
                  {trackingStatus === 'delivered' && (
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Delivered</p>
                        <p className="text-xs text-gray-500">Enjoy your meal! 🎉</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTrackingView;