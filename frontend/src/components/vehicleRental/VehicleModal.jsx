import React, { useState, useEffect } from "react";
import { X, Upload, MapPin, Calendar, DollarSign } from "lucide-react";
import { vehicleRentalAPI } from "../../services/vehicleRentalApi";
import { getSellerZones } from "../../api/sellerVehicleApi";

const VehicleModal = ({ isOpen, onClose, vehicle = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    registrationNumber: "",
    fuelType: "petrol",
    seatingCapacity: 2,
    mileage: "",
    color: "",
    rates: {
      hourly: "",
      daily: "",
      weekly: "",
      monthly: "",
    },
    assignedZone: {
      name: "",
      location: "",
    },
    features: [],
    status: "available",
    description: "",
    images: [],
  });

  const [features, setFeatures] = useState([
    { name: "GPS Navigation", selected: false },
    { name: "Bluetooth", selected: false },
    { name: "Air Conditioning", selected: false },
    { name: "Power Steering", selected: false },
    { name: "Electric Start", selected: false },
    { name: "Digital Dashboard", selected: false },
    { name: "USB Charging", selected: false },
    { name: "LED Lights", selected: false },
  ]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        ...vehicle,
        rates: vehicle.rates || {
          hourly: "",
          daily: "",
          weekly: "",
          monthly: "",
        },
        assignedZone: vehicle.assignedZone || { name: "", location: "" },
      });

      // Update features selection
      const updatedFeatures = features.map((feature) => ({
        ...feature,
        selected: vehicle.features?.includes(feature.name) || false,
      }));
      setFeatures(updatedFeatures);
    }
    fetchZones();
  }, [vehicle]);

  const fetchZones = async () => {
    try {
      const response = await getSellerZones();
      setZones(response.data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("rates.")) {
      const rateType = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        rates: {
          ...prev.rates,
          [rateType]: value,
        },
      }));
    } else if (name.startsWith("assignedZone.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        assignedZone: {
          ...prev.assignedZone,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFeatureToggle = (featureName) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.name === featureName
          ? { ...feature, selected: !feature.selected }
          : feature
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedFeatures = features
        .filter((f) => f.selected)
        .map((f) => f.name);
      const vehicleData = {
        ...formData,
        features: selectedFeatures,
      };

      if (vehicle?._id) {
        await vehicleRentalAPI.updateVehicle(vehicle._id, vehicleData);
      } else {
        await vehicleRentalAPI.createVehicle(vehicleData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Failed to save vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Honda, Yamaha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Activa, FZ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="2010"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., DL-01-AB-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleInputChange}
                    min="1"
                    max="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage (km/l)
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Red, Blue, Black"
                  />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Rental Rates
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="rates.hourly"
                    value={formData.rates.hourly}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="rates.daily"
                    value={formData.rates.daily}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="rates.weekly"
                    value={formData.rates.weekly}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="rates.monthly"
                    value={formData.rates.monthly}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>

            {/* Zone Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Zone Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone Name
                  </label>
                  <input
                    type="text"
                    name="assignedZone.name"
                    value={formData.assignedZone.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Central Delhi, South Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="assignedZone.location"
                    value={formData.assignedZone.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Connaught Place, Bandra"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Features
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {features.map((feature) => (
                  <label
                    key={feature.name}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={feature.selected}
                      onChange={() => handleFeatureToggle(feature.name)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {feature.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about the vehicle..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                <span>{vehicle ? "Update Vehicle" : "Add Vehicle"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleModal;
