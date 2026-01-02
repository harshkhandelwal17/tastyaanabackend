
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Zap, 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  Package, 
  Users, 
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Truck,
  ArrowLeft,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
export const OrderTracking = ({ orderNumber, order: orderProp }) => {
  const [order, setOrder] = useState(orderProp);
  const [loading, setLoading] = useState(!orderProp);

  useEffect(() => {
    if (!orderProp && orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      // Import laundryService dynamically to avoid circular dependency
      const laundryService = (await import('../../services/laundryService')).default;
      const response = await laundryService.trackOrder(orderNumber);
      setOrder(response?.data || response);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use prop order if available, otherwise use state
  const orderData = orderProp || order;

  if (loading || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statusSteps = [
    { id: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'blue' },
    { id: 'picked_up', label: 'Picked Up', icon: CheckCircle2, color: 'green' },
    { id: 'processing', label: 'Processing', icon: Loader2, color: 'yellow' },
    { id: 'quality_check', label: 'Quality Check', icon: Award, color: 'purple' },
    { id: 'ready', label: 'Ready', icon: Package, color: 'indigo' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'orange' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'green' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.id === orderData.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
                <p className="text-emerald-100">Order #{orderData.orderNumber || orderNumber}</p>
              </div>
              <div className="text-right bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl">
                <div className="text-sm text-emerald-100">Total Amount</div>
                <div className="text-3xl font-bold">₹{orderData.pricing?.total || orderData.total || 0}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/20">
              <div className="text-4xl bg-white/20 backdrop-blur-sm p-3 rounded-xl">{orderData.vendor?.logo || '🧺'}</div>
              <div>
                <div className="font-semibold text-lg">{orderData.vendor?.name || 'Vendor'}</div>
                <div className="flex items-center gap-4 text-sm text-emerald-100">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {orderData.totalItems || orderData.items || 0} items
                  </div>
                  {orderData.vendor?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {orderData.vendor.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Order Progress
          </h2>
          
          <div className="relative">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-start mb-8 last:mb-0 relative">
                  {index < statusSteps.length - 1 && (
                    <div className={`absolute left-7 top-16 w-1 h-full rounded-full ${
                      isCompleted ? 'bg-gradient-to-b from-emerald-500 to-teal-500' : 'bg-gray-200'
                    }`} />
                  )}

                  <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-8 ring-blue-100 scale-110'
                      : isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className={`w-7 h-7 ${isCurrent && step.id === 'processing' ? 'animate-spin' : ''}`} />
                  </div>

                  <div className="ml-6 flex-1">
                    <div className={`font-bold text-lg mb-1 ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </div>
                    
                    {orderData.statusHistory?.find(h => h.status === step.id) && (
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(orderData.statusHistory.find(h => h.status === step.id).timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    )}

                    {isCurrent && (
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-sm px-4 py-2 rounded-lg font-medium border border-blue-200">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        Current Status
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            Call Vendor
          </button>
          <button className="bg-white text-gray-700 py-4 rounded-xl font-semibold hover:shadow-lg transition-all border-2 border-gray-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};
