import React from "react";
import { Clock, ArrowRight } from "lucide-react";

const ServiceCard = ({
  service,
  onClick,
  isSelected = false,
  className = "",
  showButton = true,
}) => {
  const IconComponent = service.icon;

  return (
    <div
      className={`group cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
        isSelected
          ? "border-emerald-500 bg-emerald-50"
          : "border-gray-200 hover:border-emerald-300 bg-white"
      } ${className}`}
      onClick={onClick}
    >
      {/* Service Icon & Header */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 ${
            service.color || "bg-emerald-600"
          } text-white rounded-xl group-hover:scale-110 transition-transform`}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
          {service.tagline && (
            <p className="text-gray-600 text-sm">{service.tagline}</p>
          )}
        </div>
      </div>

      {/* Service Description */}
      <p className="text-gray-600 mb-4">{service.description}</p>

      {/* Service Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {service.price || `₹${service.basePrice}`}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {service.deliveryTime || service.time}
          </span>
        </div>

        {/* Weight/Orders info for plans */}
        {service.weight && service.orders && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {service.weight}
              </div>
              <div className="text-gray-600 text-sm">Per Month</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {service.orders}
              </div>
              <div className="text-gray-600 text-sm">Per Month</div>
            </div>
          </div>
        )}

        {/* Popular badge */}
        {service.popular && (
          <div className="flex items-center justify-center">
            <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
              Most Popular
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {showButton && (
        <button
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
            isSelected
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : service.popular
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {isSelected ? "Selected" : "Select Service"}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ServiceCard;
