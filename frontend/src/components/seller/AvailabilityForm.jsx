/**
 * Availability Form Component for Product Scheduling
 */
import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Clock, 
  Calendar,
  AlertCircle 
} from 'lucide-react';

const AvailabilityForm = ({ 
  availability = {}, 
  onChange = () => {},
  className = "" 
}) => {
  const [availabilityData, setAvailabilityData] = useState(
    availability && Object.keys(availability).length > 0
      ? availability 
      : {
          days: 'all',
          startTime: '06:00',
          endTime: '22:00'
        }
  );

  const daysOptions = [
    { value: 'all', label: 'All Days' },
    { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
    { value: 'weekends', label: 'Weekends (Sat-Sun)' },
    { value: 'monday', label: 'Monday Only' },
    { value: 'tuesday', label: 'Tuesday Only' },
    { value: 'wednesday', label: 'Wednesday Only' },
    { value: 'thursday', label: 'Thursday Only' },
    { value: 'friday', label: 'Friday Only' },
    { value: 'saturday', label: 'Saturday Only' },
    { value: 'sunday', label: 'Sunday Only' }
  ];

  const handleChange = (field, value) => {
    const updatedData = { ...availabilityData, [field]: value };
    setAvailabilityData(updatedData);
    onChange(updatedData);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Product Availability Schedule</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Set when this product is available for customers to purchase. Multiple time slots can be added for different schedules.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {/* Days Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Days
          </label>
          <select
            value={availabilityData.days}
            onChange={(e) => handleChange('days', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {daysOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={availabilityData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={availabilityData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {availabilityData.startTime >= availabilityData.endTime && (
          <div className="flex items-center gap-2 mt-3 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">End time must be after start time</span>
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const preset = {
                days: 'all',
                startTime: '00:00',
                endTime: '23:59'
              };
              setAvailabilityData(preset);
              onChange(preset);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            24/7
          </button>
          <button
            type="button"
            onClick={() => {
              const preset = {
                days: 'weekdays',
                startTime: '09:00',
                endTime: '17:00'
              };
              setAvailabilityData(preset);
              onChange(preset);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Business Hours
          </button>
          <button
            type="button"
            onClick={() => {
              const preset = {
                days: 'all',
                startTime: '06:00',
                endTime: '13:00'
              };
              setAvailabilityData(preset);
              onChange(preset);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Morning (6AM-1PM)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityForm;