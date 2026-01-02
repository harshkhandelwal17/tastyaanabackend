import React from 'react';
import { CheckCircle2, Calendar, RefreshCw, Package, Clock } from 'lucide-react';

export const PlanCard = ({ plan, vendor, onSubscribe, loading }) => {
  const schedule = plan.schedule || {};
  const frequencyLabel = schedule.frequencyType === 'weekly' 
    ? `${schedule.pickupsPerPeriod || 2} times/week`
    : `${schedule.pickupsPerPeriod || 4} times/month`;
  
  const priceLabel = schedule.frequencyType === 'weekly' ? 'week' : 'month';
  
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-gray-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold">{plan.name}</h3>
            {vendor?.name && (
              <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold">
                {vendor.name}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl lg:text-6xl font-extrabold">₹{plan.price}</span>
            <span className="text-lg opacity-90">/{priceLabel}</span>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        {/* Schedule Info */}
        {schedule.frequencyType && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">{frequencyLabel}</span>
            </div>
            {schedule.pickupDays && schedule.pickupDays.length > 0 && (
              <div className="text-sm text-gray-600 mb-1">
                Pickup: {schedule.pickupDays.map(day => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  return days[day];
                }).join(', ')}
              </div>
            )}
            {schedule.returnSchedule && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                Return: {schedule.returnSchedule.type === 'same_day' ? 'Same Day' :
                         schedule.returnSchedule.type === 'next_day' ? 'Next Day' :
                         `After ${schedule.returnSchedule.days} Days`}
              </div>
            )}
          </div>
        )}

        {/* Weight Limit */}
        <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Package className="w-4 h-4 text-gray-500" />
            {plan.maxWeight ? `${plan.maxWeight}kg per ${priceLabel}` : 'Unlimited weight'}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {schedule.pickupsPerPeriod && !plan.features?.unlimitedPickups && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">{schedule.pickupsPerPeriod} Pickups per {priceLabel}</span>
            </div>
          )}
          {plan.features?.unlimitedPickups && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">Unlimited Pickups</span>
            </div>
          )}
          {plan.features?.services && plan.features.services.length > 0 && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">
                Services: {plan.features.services.map(s => s.replace('_', ' ')).join(', ')}
              </span>
            </div>
          )}
          {plan.features?.freeDryClean > 0 && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">{plan.features.freeDryClean} Free Dry Clean Items</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {plan.features?.turnaroundTime || '48 hours'} Turnaround
            </span>
          </div>
          {plan.features?.priority && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">Priority Service</span>
            </div>
          )}
          {plan.features?.vipSupport && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">VIP Support 24/7</span>
            </div>
          )}
        </div>

        {/* Subscribe Button */}
        <button
          onClick={() => onSubscribe(plan)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-base lg:text-lg hover:shadow-xl transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg active:scale-98"
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
};
