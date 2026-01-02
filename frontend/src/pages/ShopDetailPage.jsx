import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Phone, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  useGetVehiclesQuery,
  formatVehicleForDisplay,
} from "../api/vehiclePublicApi";
import VehicleCard from "../components/vehicle/VehicleCard";

const ShopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch vehicles for this shop
  const { data: vehiclesData, isLoading } = useGetVehiclesQuery({ shopId: id });

  const vehicles = useMemo(() => {
    if (!vehiclesData?.vehicles) return [];
    return vehiclesData.vehicles.map(formatVehicleForDisplay);
  }, [vehiclesData]);

  // Get shop info from first vehicle (since all belong to same shop)
  const shop = vehicles.length > 0 ? vehicles[0].shop : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!shop && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Shop not found
          </h2>
          <button
            onClick={() => navigate("/vehicles")}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const availableVehicles = vehicles.filter(
    (v) => v.availability === "available"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 line-clamp-1">
            {shop?.name || "Shop Details"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Shop Header */}
        {shop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-6"
          >
            <div className="flex items-start gap-6">
              {/* Shop Logo */}
              {shop.profileImage && (
                <div className="flex-shrink-0">
                  <img
                    src={shop.profileImage}
                    alt={shop.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                </div>
              )}

              {/* Shop Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {shop.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-medium text-gray-700">
                      {shop.rating}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    {vehicles.length} vehicles
                  </span>
                  {availableVehicles.length > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-green-600 font-medium">
                        {availableVehicles.length} available
                      </span>
                    </>
                  )}
                </div>

                {/* Owner Name */}
                {shop.ownerName && (
                  <div className="text-gray-600 mb-2">
                    Owner: <span className="font-medium">{shop.ownerName}</span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {shop.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{shop.phone}</span>
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{shop.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <div className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                  Open Now
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Vehicles Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              Available Vehicles
            </h3>
            <div className="text-sm text-gray-600">
              {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
            </div>
          </div>

          {vehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-md p-12 text-center"
            >
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No vehicles available
              </h3>
              <p className="text-gray-500">
                This shop doesn't have any vehicles listed yet
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => (
                <motion.div
                  key={`${vehicle.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <VehicleCard vehicle={vehicle} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ShopDetailPage;
