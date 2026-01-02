import React from "react";
import {
  FiMapPin,
  FiStar,
  FiPhone,
  FiMail,
  FiUser,
  FiTruck,
} from "react-icons/fi";

const ShopCard = ({ shop, onClick, layout = "grid" }) => {
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  };

  if (layout === "list") {
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex space-x-4">
            {/* Shop Logo */}
            <div className="flex-shrink-0">
              {shop.shopLogo || shop.profileImage ? (
                <img
                  src={shop.shopLogo || shop.profileImage}
                  alt={shop.shopName}
                  className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                  onClick={onClick}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center cursor-pointer"
                  onClick={onClick}
                >
                  <FiUser size={24} className="text-green-600" />
                </div>
              )}
            </div>

            {/* Shop Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-green-600 truncate"
                    onClick={onClick}
                  >
                    {shop.shopName}
                  </h3>
                  <p className="text-sm text-gray-600">{shop.ownerName}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FiTruck size={14} />
                      <span>{shop.vehicleCount} vehicles</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{shop.availableCount} available</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {shop.rating > 0 && (
                    <div className="flex items-center space-x-1 mb-2">
                      <FiStar
                        size={16}
                        className="text-yellow-400 fill-current"
                      />
                      <span className="font-medium text-gray-900">
                        {shop.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({shop.totalReviews})
                      </span>
                    </div>
                  )}
                  {shop.priceRange && (
                    <div className="text-sm text-gray-600">
                      ₹{shop.priceRange.min} - ₹{shop.priceRange.max}/hr
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {shop.phone && (
                    <span className="flex items-center space-x-1">
                      <FiPhone size={14} />
                      <span>{formatPhoneNumber(shop.phone)}</span>
                    </span>
                  )}
                  {shop.address && (
                    <span className="flex items-center space-x-1">
                      <FiMapPin size={14} />
                      <span className="truncate">{shop.address}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={onClick}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Shop
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
      {/* Shop Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center space-x-3">
          {shop.shopLogo || shop.profileImage ? (
            <img
              src={shop.shopLogo || shop.profileImage}
              alt={shop.shopName}
              className="w-16 h-16 rounded-lg object-cover cursor-pointer"
              onClick={onClick}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-lg bg-white bg-opacity-80 flex items-center justify-center cursor-pointer border-2 border-green-200"
              onClick={onClick}
            >
              <FiUser size={24} className="text-green-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-green-600 truncate"
              onClick={onClick}
            >
              {shop.shopName}
            </h3>
            <p className="text-sm text-gray-600">{shop.ownerName}</p>
            {shop.rating > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <FiStar size={14} className="text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  {shop.rating}
                </span>
                <span className="text-xs text-gray-500">
                  ({shop.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shop Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiTruck size={18} className="text-green-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {shop.vehicleCount}
                </p>
                <p className="text-xs text-gray-600">Total Vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {shop.availableCount}
                </p>
                <p className="text-xs text-gray-600">Available Now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Types */}
        {shop.vehicleTypes && shop.vehicleTypes.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Vehicle Types:
            </p>
            <div className="flex flex-wrap gap-1">
              {shop.vehicleTypes.slice(0, 3).map((type, index) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize"
                >
                  {type.replace("-", " ")}
                </span>
              ))}
              {shop.vehicleTypes.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{shop.vehicleTypes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price Range */}
        {shop.priceRange && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Price Range:
            </p>
            <p className="text-lg font-bold text-green-600">
              ₹{shop.priceRange.min} - ₹{shop.priceRange.max}
              <span className="text-sm font-normal text-gray-600">/hour</span>
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          {shop.phone && (
            <div className="flex items-center space-x-2">
              <FiPhone size={14} />
              <span>{formatPhoneNumber(shop.phone)}</span>
            </div>
          )}
          {shop.email && (
            <div className="flex items-center space-x-2">
              <FiMail size={14} />
              <span className="truncate">{shop.email}</span>
            </div>
          )}
          {shop.address && (
            <div className="flex items-start space-x-2">
              <FiMapPin size={14} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs leading-relaxed">{shop.address}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClick}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          View All Vehicles
        </button>
      </div>
    </div>
  );
};

export default ShopCard;
