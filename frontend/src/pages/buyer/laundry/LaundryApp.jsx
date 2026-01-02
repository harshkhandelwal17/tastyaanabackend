// src/pages/buyer/laundry/LaundryApp.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { HomePage } from './HomePage';
import { VendorsPage } from './VendorsPage';
import { BookingPage } from './BookingPage';
import { OrdersPage } from './OrdersPage';
import { PlansPage } from './PlansPage';
import { SubscriptionCustomizePage } from './SubscriptionCustomizePage';
import { MySubscriptionsPage } from './MySubscriptionsPage';
import { SubscriptionDetailPage } from './SubscriptionDetailPage';
import { SubscriptionOrderPage } from './SubscriptionOrderPage';
import { OrderTracking } from '../../../components/laundry/OrderTracking';
import laundryService from '../../../services/laundryService';

// Order Tracking Page Component
function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laundryService.getOrder(orderId);
      setOrder(response?.data || response);
    } catch (error) {
      console.error('Error loading order:', error);
      setError(error.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <button 
            onClick={() => navigate('/laundry/orders')} 
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return <OrderTracking orderNumber={order.orderNumber || orderId} order={order} />;
}

// Booking Page with Vendor ID from URL
function BookingPageWrapper() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vendorId) {
      loadVendor();
    } else {
      setError('No vendor selected');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laundryService.getVendor(vendorId);
      setVendor(response?.data || response);
    } catch (error) {
      console.error('Error loading vendor:', error);
      setError(error.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The vendor you selected is not available.'}</p>
          <button 
            onClick={() => navigate('/laundry/vendors')} 
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Select Another Vendor
          </button>
        </div>
      </div>
    );
  }

  return (
    <BookingPage 
      vendor={vendor} 
      onBack={() => navigate('/laundry/vendors')} 
      onSuccess={(order) => navigate(`/laundry/orders/${order._id || order.orderNumber}`)} 
    />
  );
}

export default function LaundryApp() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const response = await laundryService.getVendors();
      setVendors(response?.data || response?.vendors || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleNavigate = (page) => {
    navigate(`/laundry/${page}`);
  };

  const handleVendorSelect = (vendor) => {
    // Navigate with vendor ID in URL
    navigate(`/laundry/booking/${vendor._id}`);
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route index element={<HomePage onNavigate={handleNavigate} />} />
        <Route path="vendors" element={<VendorsPage onVendorSelect={handleVendorSelect} />} />
        <Route path="booking/:vendorId" element={<BookingPageWrapper />} />
        <Route path="orders" element={<OrdersPage onBack={() => navigate('/laundry')} onOrderClick={(order) => navigate(`/laundry/orders/${order._id}`)} />} />
        <Route path="orders/:orderId" element={<OrderTrackingPage />} />
        <Route path="plans" element={<PlansPage vendors={vendors} />} />
        <Route path="subscriptions" element={<MySubscriptionsPage />} />
        <Route path="subscriptions/customize" element={<SubscriptionCustomizePage />} />
        <Route path="subscriptions/:subscriptionId" element={<SubscriptionDetailPage />} />
        <Route path="subscriptions/:subscriptionId/order" element={<SubscriptionOrderPage />} />
      </Routes>
    </div>
  );
}