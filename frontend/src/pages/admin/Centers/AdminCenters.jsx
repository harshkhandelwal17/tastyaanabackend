import React, { useState, useEffect } from "react";
import { useGetCentersQuery } from "../../../redux/api/adminApi";
import { toast } from "react-hot-toast";
import {
  FiMapPin,
  FiUsers,
  FiTruck,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPhone,
  FiMail,
} from "react-icons/fi";

const AdminCenters = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: centersData,
    isLoading,
    error,
    refetch,
  } = useGetCentersQuery({
    page,
    limit: 20,
    search: debouncedSearch,
    status,
  });

  const handleStatusFilter = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Centers data refreshed!");
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading centers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading centers</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const centers = centersData?.data?.centers || [];
  const pagination = centersData?.data?.pagination || {};
  const summary = centersData?.data?.summary || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Centers Management
          </h1>
          <p className="text-gray-600">
            Manage delivery zones and vehicle rental centers
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiRefreshCw className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FiMapPin className="text-blue-600 text-xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Centers</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalCenters || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-600 text-xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Centers</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.activeCenters || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FiUsers className="text-purple-600 text-xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalSellers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FiTruck className="text-orange-600 text-xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalVehicles || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search centers by name, code, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400" />
            <select
              value={status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Centers List */}
      <div className="space-y-4">
        {centers.map((center) => (
          <div key={center._id} className="bg-white rounded-lg shadow border">
            {/* Center Header */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {center.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({center.code})
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        center.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {center.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {center.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FiMapPin className="mr-1" />
                      Lat: {center.center?.lat?.toFixed(4)}, Lng:{" "}
                      {center.center?.lng?.toFixed(4)}
                    </span>
                    <span>Priority: {center.priority}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiUsers className="mr-1" />
                    {center.sellers?.length || 0} Sellers
                    <span className="ml-2 text-green-600">
                      ({center.activeSellerCount || 0} active)
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiTruck className="mr-1" />
                    {center.vehicleStats?.totalVehicles || 0} Vehicles
                    <span className="ml-2 text-green-600">
                      ({center.vehicleStats?.activeVehicles || 0} active)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Areas */}
            {center.areas && center.areas.length > 0 && (
              <div className="p-4 border-b bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Coverage Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {center.areas.map((area, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {area.locality} ({area.pincode})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sellers in this center */}
            {center.sellers && center.sellers.length > 0 && (
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Vehicle Rental Sellers ({center.sellers.length})
                </h4>
                <div className="space-y-3">
                  {center.sellers.map((seller) => (
                    <div
                      key={seller.sellerId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-medium text-gray-900">
                            {seller.name}
                          </h5>
                          <span className="text-sm text-gray-600">
                            ({seller.companyName})
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              seller.serviceStatus === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {seller.serviceStatus}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FiMail className="mr-1" />
                            {seller.email}
                          </span>
                          <span className="flex items-center">
                            <FiPhone className="mr-1" />
                            {seller.phone}
                          </span>
                          <span>Type: {seller.businessType}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div>Vehicles: {seller.totalVehicles || 0}</div>
                        <div>Active: {seller.activeVehicles || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No sellers message */}
            {(!center.sellers || center.sellers.length === 0) && (
              <div className="p-4 text-center text-gray-500">
                No vehicle rental sellers in this center
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {centers.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <FiMapPin className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No centers found
          </h3>
          <p className="text-gray-600">
            {search || status !== "all"
              ? "Try adjusting your search or filters"
              : "No centers available in the system"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalCenters} total centers)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded">
              {page}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCenters;
