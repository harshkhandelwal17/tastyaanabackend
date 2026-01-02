
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
 const SchedulePickup = ({ onSchedule, deliverySpeed }) => {
  const [pickupDate, setPickupDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [address, setAddress] = useState({
    street: '',
    area: '',
    city: 'Indore',
    pincode: '',
    contactName: '',
    contactPhone: ''
  });

  const timeSlots = [
    { id: 'morning', label: 'Morning', time: '9 AM - 12 PM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12 PM - 4 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '4 PM - 7 PM', icon: '🌆' }
  ];

  const handleSubmit = () => {
    if (!isValid) return;
    // For quick service, auto-set pickup date to today
    const finalPickupDate = deliverySpeed === 'quick' 
      ? new Date().toISOString().split('T')[0]
      : pickupDate;
    
    onSchedule({ 
      pickupDate: finalPickupDate, 
      date: finalPickupDate, // Also set as 'date' for compatibility
      timeSlot: deliverySpeed === 'quick' ? 'immediate' : timeSlot, 
      address 
    });
  };

  // Comprehensive validation
  const validateAddress = () => {
    if (!address.street || address.street.trim().length < 5) return false;
    if (!address.pincode || !/^[0-9]{6}$/.test(address.pincode)) return false;
    if (!address.contactName || address.contactName.trim().length < 2) return false;
    if (!address.contactPhone || !/^[6-9]\d{9}$/.test(address.contactPhone)) return false;
    return true;
  };

  const validatePickupDate = () => {
    if (deliverySpeed === 'quick') return true; // Quick service doesn't need date
    if (!pickupDate) return false;
    const selectedDate = new Date(pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const isValid = validateAddress() && validatePickupDate();

  if (deliverySpeed === 'quick') {
    return (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl lg:mx-auto border-2 border-gray-100">
        <div className="p-6 bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 border-b-2 border-orange-200">
          <h3 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-2">Pickup Address</h3>
          <p className="text-sm text-gray-700 font-semibold">⚡ Quick Service - We'll pick up today within 2-4 hours</p>
        </div>
        
        <div className="p-6 lg:p-8 space-y-5">
          <div className="p-5 bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-2xl shadow-sm">
            <p className="font-extrabold text-base text-orange-900 mb-1.5 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Quick Service Active
            </p>
            <p className="text-sm text-orange-800 font-semibold">Pickup today. We'll contact you within 2-4 hours.</p>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">Street Address *</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="House/Flat No, Building, Street"
              className={`w-full px-5 py-3.5 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-base bg-gray-50 font-medium ${
                address.street && address.street.trim().length < 5 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              minLength={5}
              maxLength={200}
            />
            {address.street && address.street.trim().length < 5 && (
              <p className="text-xs text-red-600 mt-1">Street address must be at least 5 characters</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Area</label>
              <input
                type="text"
                value={address.area}
                onChange={(e) => setAddress({ ...address, area: e.target.value })}
                placeholder="Area"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pincode *</label>
              <input
                type="text"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="6-digit pincode"
                maxLength={6}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.pincode && !/^[0-9]{6}$/.test(address.pincode)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {address.pincode && !/^[0-9]{6}$/.test(address.pincode) && (
                <p className="text-xs text-red-600 mt-1">Pincode must be exactly 6 digits</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
              <input
                type="text"
                value={address.contactName}
                onChange={(e) => setAddress({ ...address, contactName: e.target.value })}
                placeholder="Your Name"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.contactName && address.contactName.trim().length < 2
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                minLength={2}
                maxLength={50}
              />
              {address.contactName && address.contactName.trim().length < 2 && (
                <p className="text-xs text-red-600 mt-1">Name must be at least 2 characters</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone *</label>
              <input
                type="tel"
                value={address.contactPhone}
                onChange={(e) => setAddress({ ...address, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.contactPhone && !/^[6-9]\d{9}$/.test(address.contactPhone)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {address.contactPhone && !/^[6-9]\d{9}$/.test(address.contactPhone) && (
                <p className="text-xs text-red-600 mt-1">Enter valid 10-digit mobile number starting with 6-9</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-98 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
          >
            Continue to Confirmation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl lg:mx-auto border-2 border-gray-100">
      <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
        <h3 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-2">Schedule Pickup</h3>
        <p className="text-sm text-gray-700 font-semibold">Choose date and time for pickup</p>
      </div>
      
      <div className="p-5 lg:p-6 space-y-5">
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">Pickup Date *</label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-5 py-3.5 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-base bg-gray-50 font-medium ${
              pickupDate && new Date(pickupDate) < new Date().setHours(0, 0, 0, 0)
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-blue-500'
            }`}
          />
          {pickupDate && new Date(pickupDate) < new Date().setHours(0, 0, 0, 0) && (
            <p className="text-xs text-red-600 mt-1">Pickup date cannot be in the past</p>
          )}
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-4">Time Slot *</label>
          <div className="grid grid-cols-3 gap-4">
            {timeSlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => setTimeSlot(slot.id)}
                className={`p-5 rounded-2xl border-2 text-center transition-all duration-200 active:scale-[0.98] ${
                  timeSlot === slot.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-extrabold shadow-lg ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-2xl mb-2">{slot.icon}</div>
                <div className="font-bold text-base mb-1">{slot.label}</div>
                <div className="text-xs text-gray-600 font-semibold">{slot.time}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Street Address *</label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            placeholder="House/Flat No, Building, Street"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
              address.street && address.street.trim().length < 5 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-200 focus:border-blue-500'
            }`}
            minLength={5}
            maxLength={200}
          />
          {address.street && address.street.trim().length < 5 && (
            <p className="text-xs text-red-600 mt-1">Street address must be at least 5 characters</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Area</label>
            <input
              type="text"
              value={address.area}
              onChange={(e) => setAddress({ ...address, area: e.target.value })}
              placeholder="Area"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
            />
          </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pincode *</label>
              <input
                type="text"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="6-digit pincode"
                maxLength={6}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.pincode && !/^[0-9]{6}$/.test(address.pincode)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {address.pincode && !/^[0-9]{6}$/.test(address.pincode) && (
                <p className="text-xs text-red-600 mt-1">Pincode must be exactly 6 digits</p>
              )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
              <input
                type="text"
                value={address.contactName}
                onChange={(e) => setAddress({ ...address, contactName: e.target.value })}
                placeholder="Your Name"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.contactName && address.contactName.trim().length < 2
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                minLength={2}
                maxLength={50}
              />
              {address.contactName && address.contactName.trim().length < 2 && (
                <p className="text-xs text-red-600 mt-1">Name must be at least 2 characters</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone *</label>
              <input
                type="tel"
                value={address.contactPhone}
                onChange={(e) => setAddress({ ...address, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 ${
                  address.contactPhone && !/^[6-9]\d{9}$/.test(address.contactPhone)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {address.contactPhone && !/^[6-9]\d{9}$/.test(address.contactPhone) && (
                <p className="text-xs text-red-600 mt-1">Enter valid 10-digit mobile number starting with 6-9</p>
              )}
            </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-98 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
        >
          Continue to Confirmation
        </button>
      </div>
    </div>
  );
};

export default SchedulePickup