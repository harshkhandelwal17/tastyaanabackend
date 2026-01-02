import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  Phone, 
  MessageCircle,
  ArrowLeft,
  Navigation
} from 'lucide-react';
import DeliveryMap from '../components/delivery/DeliveryMap';
import TrackingTimeline from '../components/delivery/TrackingTimeline';
import DeliveryInfo from '../components/delivery/DeliveryInfo';
import SimpleDriverNotification from '../components/common/SimpleDriverNotification';
import toast from 'react-hot-toast';
import io from 'socket.io-client'; 

const DeliveryTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [trackingData, setTrackingData] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  useEffect(() => {
    // Initialize socket connection for real-time tracking
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Join tracking room for this order
    newSocket.emit('join-tracking', orderId);

    // Listen for real-time updates
    newSocket.on('location-update', (data) => {
      setDriverLocation(data.location);
      setEstimatedTime(data.estimatedTime);
    });

    newSocket.on('status-update', (data) => {
      setTrackingData(prev => ({
        ...prev,
        status: data.status,
        timeline: data.timeline
      }));
      
      // Show notification for status updates
      toast(`Order status updated: ${data.status}`, { duration: 2000 });
    });

    // Listen for real-time driver assignment updates
    newSocket.on('driver-assigned-realtime', (data) => {
      console.log('🚗 Driver assigned in real-time on tracking page:', data);
      
      setTrackingData(prev => ({
        ...prev,
        driver: data.driver,
        status: data.status,
        timeline: data.timeline
      }));

      // Update driver location if available
      if (data.driver?.currentLocation) {
        setDriverLocation(data.driver.currentLocation);
      }
      
      // Show success toast
      toast.success(data.message || `Driver ${data.driver.name} has been assigned!`, { duration: 2000 });
    });

    // Legacy driver assignment event (for backward compatibility)
    newSocket.on('driver-assigned', (data) => {
      console.log('🚗 Driver assigned (legacy) on tracking page:', data);
      
      if (data.driver) {
        setTrackingData(prev => ({
          ...prev,
          driver: data.driver,
          status: data.status,
          timeline: data.timeline
        }));

        if (data.driverLocation) {
          setDriverLocation(data.driverLocation);
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const data = await response.json();
      setTrackingData(data);
      setDeliveryLocation(data.deliveryAddress);
      setDriverLocation(data.driverLocation);
      setEstimatedTime(data.estimatedDeliveryTime);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking information', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCallDriver = () => {
    if (trackingData?.driver?.phone) {
      window.location.href = `tel:${trackingData.driver.phone}`;
    }
  };

  const handleMessageDriver = () => {
    // Open messaging interface
    toast('Messaging feature coming soon!', { duration: 2000 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">We couldn't find tracking information for this order.</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time Driver Assignment Notification */}
      <SimpleDriverNotification 
        userId={user?.id} 
        orderId={orderId}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Track Order #{orderId?.slice(-8)}
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time delivery tracking
                </p>
              </div>
            </div>
            
            {/* Driver Actions */}
            {trackingData.driver && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCallDriver}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Driver
                </button>
                <button
                  onClick={handleMessageDriver}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                  {estimatedTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      ETA: {estimatedTime}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-96">
                <DeliveryMap
                  deliveryLocation={deliveryLocation}
                  driverLocation={driverLocation}
                  orderId={orderId}
                />
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {trackingData.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">₹{item.price}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <DeliveryInfo trackingData={trackingData} />
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <TrackingTimeline timeline={trackingData.timeline} />
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Delivery Address
              </h3>
              <div className="text-gray-600">
                <p className="font-medium">{trackingData.deliveryAddress?.name}</p>
                <p>{trackingData.deliveryAddress?.street}</p>
                <p>{trackingData.deliveryAddress?.city}, {trackingData.deliveryAddress?.state}</p>
                <p>{trackingData.deliveryAddress?.zipCode}</p>
                {trackingData.deliveryAddress?.phone && (
                  <p className="mt-2 text-sm">Phone: {trackingData.deliveryAddress.phone}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;
