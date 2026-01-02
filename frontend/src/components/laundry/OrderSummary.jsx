
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
export const OrderSummary = ({ vendor, items, pricing, onBack, onNext }) => (
  <div className="bg-white p-6 lg:rounded-3xl lg:shadow-xl lg:border-2 lg:border-gray-200 sticky top-4">
    <h3 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-5">Order Summary</h3>
    
    {items && items.length > 0 && (
      <div className="mb-5 pb-5 border-b-2 border-gray-200">
        <div className="text-sm font-bold text-gray-700 mb-3">Items ({items.length})</div>
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
          {items.map(item => (
            <div key={item.itemKey} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-800 capitalize">{item.quantity}x {item.type.replace('_', ' ')}</span>
              <span className="font-bold text-gray-900">₹{item.totalPrice?.toFixed(0) || 0}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {pricing && (
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-sm text-gray-700">
          <span className="font-semibold">Subtotal</span>
          <span className="font-bold">₹{pricing.subtotal?.toFixed(0) || 0}</span>
        </div>
        {pricing.pickupCharges > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Pickup Charges</span>
            <span className="font-semibold">₹{pricing.pickupCharges}</span>
          </div>
        )}
        {pricing.deliveryCharges > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Charges</span>
            <span className="font-semibold">₹{pricing.deliveryCharges}</span>
          </div>
        )}
        {pricing.speedSurcharge > 0 && (
          <div className="flex justify-between text-sm text-orange-700">
            <span>Quick Service Surcharge</span>
            <span className="font-semibold">₹{pricing.speedSurcharge}</span>
          </div>
        )}
        {pricing.discount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span className="font-semibold">Discount</span>
            <span className="font-bold">-₹{pricing.discount}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl">
          <span className="font-extrabold text-base text-gray-900">Total</span>
          <span className="font-extrabold text-2xl text-blue-600">₹{pricing.total?.toFixed(0) || 0}</span>
        </div>
      </div>
    )}

    {onNext && (
      <button
        onClick={onNext}
        disabled={!items || items.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-extrabold text-base shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none mb-3"
      >
        Continue to Schedule
      </button>
    )}

    {onBack && (
      <button
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
      >
        Back
      </button>
    )}
  </div>
);
