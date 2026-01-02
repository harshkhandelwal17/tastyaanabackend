import React from 'react';
import { format } from 'date-fns';

export const DeliveryDaysSelector = ({
  days,
  availableDays = [],
  selectedDays = [],
  onDayToggle,
  errors = {}
}) => {
  // Check if a day is selectable
  const isDaySelectable = (dayId) => {
    return availableDays.some(d => d.id === dayId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Select Delivery Days
        {errors.selectedDays && (
          <span className="ml-2 text-sm font-normal text-red-500">
            {errors.selectedDays}
          </span>
        )}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {days.map(day => {
          const isAvailable = isDaySelectable(day.id);
          const isSelected = selectedDays.includes(day.id);
          
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => isAvailable && onDayToggle(day.id)}
              disabled={!isAvailable}
              className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                !isAvailable
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100'
                  : isSelected
                  ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50'
              }`}
              title={!isAvailable ? 'Not available for this plan' : ''}
            >
              {day.label.slice(0, 3)}
            </button>
          );
        })}
      </div>
      
      {availableDays.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Selected days: {selectedDays.length} of {availableDays.length} available
        </p>
      )}
    </div>
  );
};

export default DeliveryDaysSelector;
