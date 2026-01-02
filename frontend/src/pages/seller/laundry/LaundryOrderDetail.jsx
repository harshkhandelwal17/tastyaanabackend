import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit,
  User,
  Truck,
  Award
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function LaundryOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laundryService.getOrder(orderId);
      setOrder(response?.data || response);
    } catch (error) {
      console.error('Error loading order:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, note: statusNote })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Order status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNote('');
        loadOrder(); // Reload order to get updated status
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      quality_check: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      out_for_delivery: 'bg-teal-100 text-teal-800 border-teal-300',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'processing', label: 'Processing' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const statusSteps = [
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'picked_up', label: 'Picked Up', icon: Package },
    { id: 'processing', label: 'Processing', icon: Loader2 },
    { id: 'quality_check', label: 'Quality Check', icon: Award },
    { id: 'ready', label: 'Ready', icon: CheckCircle2 },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist or you do not have permission to view it.'}</p>
          <button
            onClick={() => navigate('/seller/laundry/orders')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/seller/laundry/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
            </div>
            <button
              onClick={() => {
                setNewStatus(order.status);
                setShowStatusModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Update Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.id} className="flex items-start mb-6 last:mb-0 relative">
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute left-6 top-12 w-0.5 h-full ${
                          isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                        }`} />
                      )}
                      <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Icon className={`w-6 h-6 ${isCurrent && step.id === 'processing' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className={`font-bold text-base ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </div>
                        {order.statusHistory?.find(h => h.status === step.id) && (
                          <div className="text-sm text-gray-600 mt-1">
                            {new Date(order.statusHistory.find(h => h.status === step.id).timestamp).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
              {order.user && (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-semibold text-gray-900">{order.user.name || 'N/A'}</p>
                  </div>
                  {order.user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{order.user.email}</span>
                    </div>
                  )}
                  {order.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{order.user.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pickup & Delivery Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Pickup & Delivery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Pickup Address</h3>
                  {order.schedule?.pickup?.address && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{order.schedule.pickup.address.street}</p>
                      {order.schedule.pickup.address.area && <p>{order.schedule.pickup.address.area}</p>}
                      <p>{order.schedule.pickup.address.city} - {order.schedule.pickup.address.pincode}</p>
                      {order.schedule.pickup.address.contactName && (
                        <p className="mt-2 font-medium">Contact: {order.schedule.pickup.address.contactName}</p>
                      )}
                      {order.schedule.pickup.address.contactPhone && (
                        <p>{order.schedule.pickup.address.contactPhone}</p>
                      )}
                    </div>
                  )}
                  {order.schedule?.pickup?.date && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Date: </span>
                      <span className="font-medium">{new Date(order.schedule.pickup.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                  {order.schedule?.pickup?.timeSlot && (
                    <div className="text-sm">
                      <span className="text-gray-600">Time: </span>
                      <span className="font-medium">{order.schedule.pickup.timeSlot}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                  {order.schedule?.delivery?.address && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{order.schedule.delivery.address.street}</p>
                      {order.schedule.delivery.address.area && <p>{order.schedule.delivery.address.area}</p>}
                      <p>{order.schedule.delivery.address.city} - {order.schedule.delivery.address.pincode}</p>
                    </div>
                  )}
                  {order.schedule?.delivery?.date && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Expected Date: </span>
                      <span className="font-medium">{new Date(order.schedule.delivery.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-3">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 capitalize mb-1">
                          {item.type?.replace('_', ' ')} - {item.serviceType?.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Quantity: {item.quantity}</p>
                          {item.weight && <p>Weight: {item.weight} kg</p>}
                          {item.pricingModel === 'weight_based' && item.pricePerKg && (
                            <p>Price: ₹{item.pricePerKg}/kg</p>
                          )}
                          {item.pricingModel === 'per_piece' && item.pricePerItem && (
                            <p>Price: ₹{item.pricePerItem}/piece</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₹{item.totalPrice?.toFixed(2) || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{order.pricing?.subtotal?.toFixed(2) || 0}</span>
                </div>
                {order.pricing?.pickupCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pickup Charges</span>
                    <span className="font-semibold">₹{order.pricing.pickupCharges}</span>
                  </div>
                )}
                {order.pricing?.deliveryCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="font-semibold">₹{order.pricing.deliveryCharges}</span>
                  </div>
                )}
                {order.pricing?.speedSurcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quick Service Surcharge</span>
                    <span className="font-semibold">₹{order.pricing.speedSurcharge}</span>
                  </div>
                )}
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{order.pricing.discount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">₹{order.pricing?.total?.toFixed(2) || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Order Date:</span>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Service Type:</span>
                  <p className="font-semibold capitalize">{order.deliverySpeed || 'scheduled'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <p className="font-semibold capitalize">{order.payment?.method || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Payment Status:</span>
                  <p className="font-semibold capitalize">{order.payment?.status || 'pending'}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Special Instructions</h2>
                <p className="text-sm text-gray-600">{order.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Order Status</h2>
            <p className="text-gray-600 mb-4">Order: {order.orderNumber}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a note about this status update..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={updateOrderStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

