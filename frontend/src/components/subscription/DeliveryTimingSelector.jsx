import React from 'react';

const DELIVERY_TIMINGS = [
  { id: 'morning', label: 'Morning (8:00 AM - 10:00 AM)' },
  { id: 'lunch', label: 'Lunch (12:00 PM - 2:00 PM)' },
  { id: 'evening', label: 'Evening (6:00 PM - 8:00 PM)' },
];

export const DeliveryTimingSelector = ({
  selectedTiming,
  onTimingChange,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Delivery Timing
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DELIVERY_TIMINGS.map(timing => (
          <label 
            key={timing.id} 
            className={`flex items-center p-4 rounded-xl border-2 transition-colors cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              selectedTiming === timing.id
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 hover:border-amber-200'
            }`}
          >
            <input
              type="radio"
              name="deliveryTiming"
              value={timing.id}
              checked={selectedTiming === timing.id}
              onChange={() => onTimingChange(timing.id)}
              disabled={disabled}
              className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-gray-900">
                {timing.label.split(' (')[0]}
              </span>
              <span className="block text-sm text-gray-500">
                {timing.label.match(/\(([^)]+)\)/)[1]}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DeliveryTimingSelector;
