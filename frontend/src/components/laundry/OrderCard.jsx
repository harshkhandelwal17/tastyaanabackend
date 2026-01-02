
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
export const OrderCard = ({ order, onClick }) => {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
    pickup_enroute: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    picked_up: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    processing: 'bg-purple-100 text-purple-700 border-purple-300',
    quality_check: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    ready: 'bg-teal-100 text-teal-700 border-teal-300',
    out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-300',
    delivered: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300'
  };

  const getStatusIcon = () => {
    switch(order.status) {
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div 
      onClick={() => onClick && onClick(order)}
      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-5 lg:p-6 cursor-pointer border-2 border-gray-100 active:scale-[0.98] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-lg text-gray-900 mb-1.5">Order #{order.orderNumber || order._id?.slice(-6)}</div>
          <div className="text-sm text-gray-600 font-medium">
            {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
        <span className={`px-3 py-2 rounded-xl text-xs font-bold border-2 flex items-center gap-2 flex-shrink-0 ml-3 ${statusColors[order.status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
          {getStatusIcon()}
          <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
        <div className="text-4xl flex-shrink-0 transform hover:scale-110 transition-transform">{order.vendor?.logo || '🧺'}</div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-base text-gray-900 truncate mb-1">{order.vendor?.name || 'Vendor'}</div>
          <div className="text-sm text-gray-600 font-semibold">{order.items?.length || order.totalItems || 0} items</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 mb-4">
        <div className="text-sm text-gray-600 font-bold">Total Amount</div>
        <div className="font-extrabold text-2xl text-blue-600">₹{order.pricing?.total || order.total || 0}</div>
      </div>
      
      <div className="pt-4 border-t-2 border-gray-200">
        <button className="w-full text-base font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-all group">
          <span>View Details</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

