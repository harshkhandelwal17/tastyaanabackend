import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetVehiclesQuery,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} from "../../../redux/api/vehicleApi";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
  FiPlus,
  FiSearch,
  FiFilter,
  FiMapPin,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
const AdminAvailableVehicles = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "available",
    zoneCode: "",
  });

  const {
    data: vehiclesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetVehiclesQuery({
    ...filters,
    page: 1,
    limit: 50,
  });

  const [updateVehicle] = useUpdateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();

  const vehicles = vehiclesResponse?.data || [];

  const handleStatusToggle = async (vehicleId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateVehicle({
        vehicleId,
        status: newStatus,
      }).unwrap();

      toast.success(
        `Vehicle ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`
      );
      refetch();
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      toast.error("Failed to update vehicle status");
    }
  };

  const handleAvailabilityToggle = async (vehicleId, currentAvailability) => {
    try {
      const newAvailability =
        currentAvailability === "available" ? "unavailable" : "available";
      await updateVehicle({
        vehicleId,
        availability: newAvailability,
      }).unwrap();

      toast.success(`Vehicle marked as ${newAvailability}`);
      refetch();
    } catch (error) {
      console.error("Error updating vehicle availability:", error);
      toast.error("Failed to update vehicle availability");
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vehicle? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteVehicle(vehicleId).unwrap();
      toast.success("Vehicle deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    }
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Inactive
        </span>
      );
    }
  };

  const getAvailabilityBadge = (availability) => {
    if (availability === "available") {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Available
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Unavailable
        </span>
      );
    }
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading vehicles: {error?.data?.message || "Unknown error"}
          </p>
          <button
            onClick={refetch}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Available Vehicles
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your vehicle fleet and availability
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/admin/vehicles/add")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="scooter">Scooter</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center">
            <FaCar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No vehicles found</p>
            <button
              onClick={() => navigate("/admin/vehicles/add")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Vehicle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {vehicle.vehicleImages?.[0] ? (
                          <img
                            src={vehicle.vehicleImages[0]}
                            alt={vehicle.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FaCar className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.companyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vehicle.vehicleNo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{vehicle.category}</div>
                        <div className="text-gray-500 flex items-center">
                          <FiMapPin className="w-3 h-3 mr-1" />
                          {vehicle.zoneCenterName}
                        </div>
                        <div className="text-gray-500">
                          Deposit: ₹{vehicle.depositAmount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>
                          12hr: ₹{vehicle.rate12hr?.withoutFuelPerHour || 0}/hr
                        </div>
                        <div>
                          24hr: ₹{vehicle.rate24hr?.withoutFuelPerHour || 0}/hr
                        </div>
                        <div className="text-gray-500">
                          KM: {vehicle.rate24hr?.kmLimit || 0} limit
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {getStatusBadge(vehicle.status)}
                        {getAvailabilityBadge(vehicle.availability)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/vehicles/${vehicle._id}`)
                          }
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/vehicles/edit/${vehicle._id}`)
                          }
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Edit Vehicle"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleStatusToggle(vehicle._id, vehicle.status)
                          }
                          className={`p-1 ${
                            vehicle.status === "active"
                              ? "text-green-600 hover:text-green-700"
                              : "text-gray-600 hover:text-gray-700"
                          }`}
                          title={`${
                            vehicle.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          } Vehicle`}
                        >
                          {vehicle.status === "active" ? (
                            <FiToggleRight className="w-4 h-4" />
                          ) : (
                            <FiToggleLeft className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleAvailabilityToggle(
                              vehicle._id,
                              vehicle.availability
                            )
                          }
                          className={`p-1 ${
                            vehicle.availability === "available"
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-gray-600 hover:text-gray-700"
                          }`}
                          title={`Mark as ${
                            vehicle.availability === "available"
                              ? "Unavailable"
                              : "Available"
                          }`}
                        >
                          {vehicle.availability === "available" ? "🟢" : "🔴"}
                        </button>

                        <button
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Vehicle"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAvailableVehicles;
