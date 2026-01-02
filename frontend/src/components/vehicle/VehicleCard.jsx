import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VehicleCard = ({ vehicle, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  // Determine availability status
  const getAvailabilityInfo = () => {
    if (vehicle.availability === "available") {
      return {
        isAvailable: true,
        text: "Available Now",
      };
    } else if (vehicle.nextAvailableTime) {
      const date = new Date(vehicle.nextAvailableTime);
      // Format: 01/01/2026 (09:00 am)
      const dateStr = date.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return {
        isAvailable: false,
        text: `Available from ${dateStr} (${timeStr})`,
      };
    } else {
      return {
        isAvailable: false,
        text: "Booked",
      };
    }
  };

  const availability = getAvailabilityInfo();
  const isAvailable = availability.isAvailable;
  const mainImage =
    vehicle.images?.[0] ||
    vehicle.vehicleImages?.[0] ||
    "/placeholder-vehicle.jpg";

  return (
    <motion.div
      onClick={handleClick}
      className={`bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${className}`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Vehicle Image */}
      <div className="relative h-28 sm:h-36 md:h-48 overflow-hidden">
        <img
          src={mainImage}
          alt={vehicle.name}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-110 ${
            !isAvailable ? "grayscale opacity-75" : ""
          }`}
        />

        {/* Availability Overlay - Centered if booked */}
        {!isAvailable && availability.text !== "Booked" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg shadow-lg text-[10px] sm:text-sm font-bold text-gray-900 border border-gray-200 text-center leading-tight">
              {availability.text}
            </div>
          </div>
        ) : !isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg shadow-lg text-xs sm:text-sm font-bold text-gray-900 border border-gray-200">
              Booked
            </div>
          </div>
        ) : (
          /* Available Badge - Top Right */
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500 text-white shadow-sm">
            Available
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-2 sm:p-3 md:p-4">
        {/* Vehicle Name */}
        <h3 className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-1 sm:mb-2 line-clamp-1">
          {vehicle.name}
        </h3>

        {/* Rating and Shop */}
        <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-3">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">
              {vehicle.shop?.rating || vehicle.rating || 4.5}
            </span>
          </div>
          <span className="text-gray-400 text-[10px] sm:text-sm hidden xs:inline">
            •
          </span>
          <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 line-clamp-1 hidden xs:inline">
            {vehicle.shop?.name || vehicle.shop?.shopName || "Shop"}
          </span>
        </div>

        {/* Features - Hidden on very small screens, show 1 on small, more on larger */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
          {vehicle.fuelType && (
            <span
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium ${
                vehicle.fuelType.toLowerCase() === "electric"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {vehicle.fuelType}
            </span>
          )}
          {vehicle.type && (
            <span className="hidden sm:inline-block px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-medium bg-gray-100 text-gray-700">
              {vehicle.type}
            </span>
          )}
          {vehicle.specifications?.mileage && (
            <span className="hidden md:inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {vehicle.specifications.mileage}
            </span>
          )}
        </div>

        {/* Location (if available) - Hidden on mobile */}
        {vehicle.location?.zone && (
          <div className="hidden sm:flex items-center gap-1 mb-3 text-xs md:text-sm text-gray-600">
            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
            <span className="line-clamp-1">{vehicle.location.zone}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm sm:text-lg md:text-2xl font-bold text-green-600">
              ₹{vehicle.pricing?.hourly || vehicle.ratePerHour || 0}
            </span>
            <span className="text-[9px] sm:text-xs md:text-sm text-gray-500 ml-0.5 sm:ml-1">
              /hr
            </span>
          </div>
          {/* {vehicle.pricing?.daily && (
                        <div className="text-right hidden sm:block">
                            <span className="text-xs md:text-sm text-gray-600">
                                ₹{vehicle.pricing.daily}/day
                            </span>
                        </div>
                    )} */}
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleCard;
