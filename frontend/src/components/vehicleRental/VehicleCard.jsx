import React from "react";
import { FiMapPin, FiClock, FiStar, FiUser, FiSettings } from "react-icons/fi";

const VehicleCard = ({ vehicle, onClick, onShopClick, layout = "grid" }) => {
  const formatPrice = (price) => {
    if (!price) return "N/A";
    return `₹${price}`;
  };

  const formatAvailability = () => {
    if (vehicle.availability === "available") {
      return {
        text: "Available Now",
        className: "bg-green-100 text-green-800",
        icon: "✅",
      };
    } else if (vehicle.availability === "booked" && vehicle.nextAvailableTime) {
      const date = new Date(vehicle.nextAvailableTime);
      return {
        text: `Available ${date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        className: "bg-orange-100 text-orange-800",
        icon: "⏰",
      };
    } else {
      return {
        text: "Currently Booked",
        className: "bg-red-100 text-red-800",
        icon: "❌",
      };
    }
  };

  const availability = formatAvailability();

  if (layout === "list") {
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex space-x-4">
            {/* Vehicle Image */}
            <div className="flex-shrink-0">
              <img
                src={vehicle.images?.[0] || "/api/placeholder/150/100"}
                alt={vehicle.name}
                className="w-24 h-16 object-cover rounded-lg cursor-pointer"
                onClick={onClick}
              />
            </div>

            {/* Vehicle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-green-600 truncate"
                    onClick={onClick}
                  >
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vehicle.type?.charAt(0).toUpperCase() +
                      vehicle.type?.slice(1).replace("-", " ")}{" "}
                    • {vehicle.fuelType}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${availability.className}`}
                  >
                    {availability.icon} {availability.text}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(vehicle.pricing?.hourly)}/hr
                    </p>
                    {vehicle.pricing?.daily && (
                      <p className="text-sm text-gray-500">
                        {formatPrice(vehicle.pricing?.daily)}/day
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <FiMapPin size={14} />
                    <span>{vehicle.location?.center}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiSettings size={14} />
                    <span>{vehicle.specifications?.seatingCapacity} Seats</span>
                  </span>
                </div>

                <button
                  onClick={onShopClick}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600"
                >
                  <div className="flex items-center space-x-1">
                    {vehicle.shop?.profileImage ? (
                      <img
                        src={vehicle.shop.profileImage}
                        alt={vehicle.shop.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <FiUser size={16} />
                    )}
                    <span>{vehicle.shop?.name}</span>
                    {vehicle.shop?.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <FiStar
                          size={12}
                          className="text-yellow-400 fill-current"
                        />
                        <span className="text-xs">{vehicle.shop.rating}</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
      {/* Vehicle Image */}
      <div className="relative">
        <img
          src={vehicle.images?.[0] || "/api/placeholder/300/200"}
          alt={vehicle.name}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={onClick}
        />
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${availability.className}`}
        >
          {availability.icon} {availability.text}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 px-3 py-1 rounded-lg">
          <p className="text-sm font-bold text-green-600">
            {formatPrice(vehicle.pricing?.hourly)}/hr
          </p>
          {vehicle.pricing?.daily && (
            <p className="text-xs text-gray-500">
              {formatPrice(vehicle.pricing?.daily)}/day
            </p>
          )}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-green-600 truncate"
            onClick={onClick}
          >
            {vehicle.brand} {vehicle.model}
          </h3>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <span
                className={`text-lg ${
                  vehicle.type?.includes("bike")
                    ? "🏍️"
                    : vehicle.type?.includes("car")
                    ? "🚗"
                    : vehicle.type?.includes("scooty")
                    ? "🛵"
                    : "🚗"
                }`}
              >
                {vehicle.type?.includes("bike")
                  ? "🏍️"
                  : vehicle.type?.includes("car")
                  ? "🚗"
                  : vehicle.type?.includes("scooty")
                  ? "🛵"
                  : "🚗"}
              </span>
              <span className="capitalize">
                {vehicle.type?.replace("-", " ")}
              </span>
            </span>
            <span className="flex items-center space-x-1">
              <span
                className={`text-lg ${
                  vehicle.fuelType?.includes("electric") ||
                  vehicle.fuelType?.includes("ev")
                    ? "⚡"
                    : vehicle.fuelType?.includes("petrol")
                    ? "⛽"
                    : vehicle.fuelType?.includes("diesel")
                    ? "🛢️"
                    : "⛽"
                }`}
              >
                {vehicle.fuelType?.includes("electric") ||
                vehicle.fuelType?.includes("ev")
                  ? "⚡"
                  : vehicle.fuelType?.includes("petrol")
                  ? "⛽"
                  : vehicle.fuelType?.includes("diesel")
                  ? "🛢️"
                  : "⛽"}
              </span>
              <span className="capitalize">{vehicle.fuelType}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <FiMapPin size={14} />
              <span className="truncate">{vehicle.location?.center}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiSettings size={14} />
              <span>{vehicle.specifications?.seatingCapacity} Seats</span>
            </span>
          </div>
        </div>

        {/* Shop Info */}
        <div className="border-t pt-3">
          <button
            onClick={onShopClick}
            className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2"
          >
            <div className="flex items-center space-x-2">
              {vehicle.shop?.profileImage ? (
                <img
                  src={vehicle.shop.profileImage}
                  alt={vehicle.shop.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FiUser size={16} className="text-green-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {vehicle.shop?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {vehicle.shop?.ownerName}
                </p>
              </div>
            </div>

            {vehicle.shop?.rating > 0 && (
              <div className="flex items-center space-x-1">
                <FiStar size={14} className="text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">
                  {vehicle.shop.rating}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
