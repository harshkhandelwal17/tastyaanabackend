import React from 'react';
import { MapPin, X } from 'lucide-react';

const LocationModal = ({ 
  showLocationModal, 
  setShowLocationModal, 
  selectedLocation, 
  setSelectedLocation 
}) => {
  if (!showLocationModal) return null;

  const locations = [
    { name: "Vijay Nagar", area: "Indore, Madhya Pradesh", time: "8-12 min", popular: true },
    { name: "Palasia", area: "Indore, Madhya Pradesh", time: "10-15 min", popular: false },
    { name: "Sapna Sangeeta", area: "Indore, Madhya Pradesh", time: "12-18 min", popular: false },
    { name: "Rau", area: "Indore, Madhya Pradesh", time: "15-20 min", popular: false }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-lg transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Select Delivery Location</h3>
          <p className="text-gray-600 text-sm sm:text-base">Choose your area for accurate delivery time & pricing</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {locations.map((location, index) => (
            <button 
              key={index}
              onClick={() => {
                setSelectedLocation(`${location.name}, Indore`);
                setShowLocationModal(false);
              }}
              className="w-full text-left p-3 sm:p-4 hover:bg-purple-50 rounded-2xl flex items-center justify-between transition-all group border-2 border-transparent hover:border-purple-200 touch-manipulation min-h-[60px]"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800 text-sm sm:text-base truncate">{location.name}</p>
                    {location.popular && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{location.area}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs sm:text-sm font-semibold text-green-600">{location.time}</p>
                <p className="text-xs text-gray-400">delivery</p>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowLocationModal(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all min-h-[44px]">
            Use Current Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;