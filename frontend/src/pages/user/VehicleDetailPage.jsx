import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetPublicVehicleByIdQuery,
  useCheckVehicleAvailabilityMutation,
} from "../../redux/api/vehicleApi";
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiStar,
  FiShield,
  FiSettings,
  FiCheckCircle,
  FiCalendar,
  FiInfo,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { FaGasPump } from "react-icons/fa";

const VehicleDetailPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedRateType, setSelectedRateType] = useState("12hr");
  const [availabilityData, setAvailabilityData] = useState(null);

  // RTK Query hooks
  const {
    data: vehicleData,
    isLoading: vehicleLoading,
    error: vehicleError,
  } = useGetPublicVehicleByIdQuery(vehicleId);

  const [checkAvailabilityMutation, { isLoading: checkingAvailability }] =
    useCheckVehicleAvailabilityMutation();

  // Extract vehicle from data
  const vehicle = vehicleData?.data?.vehicle || null;
  const loading = vehicleLoading;

  // Handle error states
  useEffect(() => {
    if (vehicleError) {
      console.error("Error fetching vehicle:", vehicleError);
      toast.error("Vehicle not found");
      navigate("/vehicles");
    }
  }, [vehicleError, navigate]);

  // Check availability for next 24 hours
  const checkVehicleAvailability = async () => {
    if (!vehicleId) return;

    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

      const result = await checkAvailabilityMutation({
        vehicleId: vehicleId,
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
      }).unwrap();

      setAvailabilityData(result.data);
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailabilityData({ available: false });
    }
  };

  useEffect(() => {
    if (vehicle) {
      checkVehicleAvailability();
    }
  }, [vehicle]);

  const handleBookNow = () => {
    navigate(`/vehicles/${vehicleId}/book`, {
      state: { vehicle, selectedRateType },
    });
  };

  const getRateInfo = (type) => {
    if (!vehicle) return null;

    switch (type) {
      case "12hr":
        return vehicle.rate12hr;
      case "24hr":
        return vehicle.rate24hr;
      default:
        return vehicle.rate12hr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vehicle Not Found
          </h2>
          <button
            onClick={() => navigate("/vehicles")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {vehicle.name}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                {vehicle.companyName} • {vehicle.vehicleNo}
              </p>
            </div>

            {availabilityData && (
              <div className="mt-4 md:mt-0">
                {availabilityData.available ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <FiCheckCircle className="w-4 h-4 mr-1" />
                    Available Now
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <FiInfo className="w-4 h-4 mr-1" />
                    Currently Unavailable
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Images */}
          <div className="space-y-4">
            <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-xl overflow-hidden">
              {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
                <img
                  src={vehicle.vehicleImages[activeImageIndex]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🚗
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {vehicle.vehicleImages && vehicle.vehicleImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {vehicle.vehicleImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-w-16 aspect-h-12 rounded-lg overflow-hidden border-2 ${
                      activeImageIndex === index
                        ? "border-indigo-600"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${vehicle.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Info & Booking */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiSettings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold capitalize">
                      {vehicle.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaGasPump className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-semibold">{vehicle.type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiMapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{vehicle.zoneCenterName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FiStar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-semibold">
                      {vehicle.analytics?.averageRating
                        ? `${vehicle.analytics.averageRating.toFixed(1)} ⭐`
                        : "New Vehicle"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {vehicle.vehicleFeatures?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>

              {/* Rate Type Selector */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSelectedRateType("12hr")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedRateType === "12hr"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  12 Hour Plan
                </button>
                <button
                  onClick={() => setSelectedRateType("24hr")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedRateType === "24hr"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  24 Hour Plan
                </button>
              </div>

              {/* Rate Details */}
              {(() => {
                const rate = getRateInfo(selectedRateType);
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per Hour</span>
                      <span className="font-semibold">
                        ₹{rate?.ratePerHour || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">KM Limit</span>
                      <span className="font-semibold">
                        {rate?.kmLimit || 0} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extra Charge/KM</span>
                      <span className="font-semibold">
                        ₹{rate?.extraChargePerKm || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grace Period</span>
                      <span className="font-semibold">
                        {rate?.gracePeriodMinutes || 0} mins
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-semibold">
                        ₹{vehicle.depositAmount}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleBookNow}
              disabled={!availabilityData?.available}
              className={`w-full py-4 rounded-xl font-semibold text-lg ${
                availabilityData?.available
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors`}
            >
              {availabilityData?.available
                ? "Book Now"
                : "Currently Unavailable"}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-6">
              Vehicle Specifications
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Number</span>
                <span className="font-semibold">{vehicle.vehicleNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Company</span>
                <span className="font-semibold">{vehicle.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color</span>
                <span className="font-semibold">{vehicle.color || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Capacity</span>
                <span className="font-semibold">
                  {vehicle.fuelCapacity || "N/A"} L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mileage</span>
                <span className="font-semibold">
                  {vehicle.mileage || "N/A"} km/l
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Reading</span>
                <span className="font-semibold">{vehicle.meterReading} km</span>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-6">Pickup Location</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">
                  {vehicle.zoneCenterName}
                </h4>
                <p className="text-gray-600 mt-1">
                  {vehicle.zoneCenterAddress}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4" />
                <span>Zone: {vehicle.zoneCode}</span>
              </div>

              {/* Maintenance Info */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Maintenance Status
                </h4>
                {vehicle.maintenance && vehicle.maintenance.length > 0 ? (
                  <div className="text-sm text-gray-600">
                    Last Service:{" "}
                    {new Date(
                      vehicle.maintenance[0].lastServicingDate
                    ).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    Well maintained vehicle
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
