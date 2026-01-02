import React, { useState, useEffect } from "react";
import {
  useGetAdminDailyDeliveriesQuery,
  useGetAdminDeliveryStatsQuery,
  useGetAdminDeliveryFiltersQuery,
  useAdminSkipMealMutation,
  useAdminCustomizeMealMutation,
  useAdminUpdateDeliveryStatusMutation,
  useAdminBulkUpdateDeliveryStatusMutation,
  useAdminBulkSkipMealsMutation,
} from "../redux/storee/api";
import { toast } from "react-hot-toast";
import moment from "moment-timezone";

const AdminDeliveryManagement = () => {
  // Filter states
  const [filters, setFilters] = useState({
    date: moment().format("YYYY-MM-DD"),
    shift: "all",
    zone: "all",
    driverId: "all",
    sellerId: "all",
    status: "all",
    mealPlan: "all",
    priceMin: "",
    priceMax: "",
    search: "",
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [customizationModal, setCustomizationModal] = useState(null);
  const [skipModal, setSkipModal] = useState(null);

  // API queries
  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    error: deliveriesError,
  } = useGetAdminDailyDeliveriesQuery({ ...filters, page, limit });

  const { data: statsData, isLoading: statsLoading } =
    useGetAdminDeliveryStatsQuery(filters);

  const { data: filtersData, isLoading: filtersLoading } =
    useGetAdminDeliveryFiltersQuery();

  // Mutations
  const [adminSkipMeal] = useAdminSkipMealMutation();
  const [adminCustomizeMeal] = useAdminCustomizeMealMutation();
  const [adminUpdateDeliveryStatus] = useAdminUpdateDeliveryStatusMutation();
  const [adminBulkUpdateDeliveryStatus] =
    useAdminBulkUpdateDeliveryStatusMutation();
  const [adminBulkSkipMeals] = useAdminBulkSkipMealsMutation();

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedDeliveries([]);
  };

  // Handle delivery selection
  const handleDeliverySelect = (deliveryId, checked) => {
    if (checked) {
      setSelectedDeliveries((prev) => [...prev, deliveryId]);
    } else {
      setSelectedDeliveries((prev) => prev.filter((id) => id !== deliveryId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDeliveries(deliveriesData?.data?.map((d) => d._id) || []);
    } else {
      setSelectedDeliveries([]);
    }
  };

  // Handle single delivery status update
  const handleStatusUpdate = async (deliveryId, status, notes = "") => {
    try {
      await adminUpdateDeliveryStatus({
        deliveryId,
        status,
        notes,
        notifyUser: true,
      }).unwrap();
      toast.success("Delivery status updated successfully");
    } catch (error) {
      toast.error("Failed to update delivery status");
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status, notes = "") => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select deliveries to update");
      return;
    }

    try {
      await adminBulkUpdateDeliveryStatus({
        deliveryIds: selectedDeliveries,
        status,
        notes,
        notifyUsers: true,
      }).unwrap();
      toast.success(
        `${selectedDeliveries.length} deliveries updated successfully`
      );
      setSelectedDeliveries([]);
    } catch (error) {
      toast.error("Failed to update deliveries");
    }
  };

  // Handle skip meal
  const handleSkipMeal = async (deliveryId, reason) => {
    try {
      await adminSkipMeal({
        deliveryId,
        reason,
        notifyUser: true,
      }).unwrap();
      toast.success("Meal skipped successfully");
      setSkipModal(null);
    } catch (error) {
      toast.error("Failed to skip meal");
    }
  };

  // Handle bulk skip meals
  const handleBulkSkipMeals = async (reason) => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select deliveries to skip");
      return;
    }

    try {
      await adminBulkSkipMeals({
        deliveryIds: selectedDeliveries,
        reason,
        notifyUsers: true,
      }).unwrap();
      toast.success(`${selectedDeliveries.length} meals skipped successfully`);
      setSelectedDeliveries([]);
    } catch (error) {
      toast.error("Failed to skip meals");
    }
  };

  // Handle customize meal
  const handleCustomizeMeal = async (deliveryId, customizations, notes) => {
    try {
      await adminCustomizeMeal({
        deliveryId,
        customizations,
        notes,
        notifyUser: true,
      }).unwrap();
      toast.success("Meal customized successfully");
      setCustomizationModal(null);
    } catch (error) {
      toast.error("Failed to customize meal");
    }
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      delivered: "bg-green-100 text-green-800",
      skipped: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  useEffect(() => {
    setShowBulkActions(selectedDeliveries.length > 0);
  }, [selectedDeliveries]);

  if (deliveriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Daily Delivery Management
          </h1>

          {/* Stats Cards */}
          {!statsLoading && statsData?.data && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {statsData.data.total || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {statsData.data.pending || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">
                  Delivered
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {statsData.data.delivered || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Skipped</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData.data.skipped || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-600">Cancelled</h3>
                <p className="text-2xl font-bold text-red-900">
                  {statsData.data.cancelled || 0}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Shift Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                value={filters.shift}
                onChange={(e) => handleFilterChange("shift", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => handleFilterChange("zone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Zones</option>
                {filtersData?.data?.zones?.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver
              </label>
              <select
                value={filters.driverId}
                onChange={(e) => handleFilterChange("driverId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Drivers</option>
                {filtersData?.data?.drivers?.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller
              </label>
              <select
                value={filters.sellerId}
                onChange={(e) => handleFilterChange("sellerId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Sellers</option>
                {filtersData?.data?.sellers?.map((seller) => (
                  <option key={seller._id} value={seller._id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="skipped">Skipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Meal Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Plan
              </label>
              <select
                value={filters.mealPlan}
                onChange={(e) => handleFilterChange("mealPlan", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Plans</option>
                {filtersData?.data?.mealPlans?.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by customer name, phone, address..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedDeliveries.length} deliveries selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate("delivered")}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  Mark Delivered
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Enter reason for skipping:");
                    if (reason) handleBulkSkipMeals(reason);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Bulk Skip
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("cancelled")}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedDeliveries.length ===
                        deliveriesData?.data?.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meal Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone/Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveriesData?.data?.map((delivery) => (
                  <tr key={delivery._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDeliveries.includes(delivery._id)}
                        onChange={(e) =>
                          handleDeliverySelect(delivery._id, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.user?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.user?.phone}
                        </div>
                        <div className="text-xs text-gray-400">
                          {delivery.address?.area}, {delivery.address?.city}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.mealPlan?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.shift} •{" "}
                          {moment(delivery.date).format("MMM DD")}
                        </div>
                        <div className="text-xs text-gray-400">
                          Seller: {delivery.seller?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {delivery.zone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.driver?.name || "Unassigned"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          delivery.status
                        )}`}
                      >
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{delivery.price}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {delivery.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(delivery._id, "delivered")
                              }
                              className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Deliver
                            </button>
                            <button
                              onClick={() => setSkipModal(delivery)}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => setCustomizationModal(delivery)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            >
                              Customize
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            handleStatusUpdate(delivery._id, "cancelled")
                          }
                          className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {deliveriesData?.pagination && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, deliveriesData.pagination.total)} of{" "}
                  {deliveriesData.pagination.total} deliveries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= deliveriesData.pagination.pages}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skip Modal */}
      {skipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Skip Meal</h3>
            <p className="text-gray-600 mb-4">
              Skip meal for {skipModal.user?.name} on{" "}
              {moment(skipModal.date).format("MMM DD, YYYY")} ({skipModal.shift}
              )?
            </p>
            <input
              type="text"
              placeholder="Enter reason for skipping..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              id="skipReason"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSkipModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = document.getElementById("skipReason").value;
                  if (reason.trim()) {
                    handleSkipMeal(skipModal._id, reason);
                  } else {
                    toast.error("Please enter a reason");
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Skip Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {customizationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Customize Meal</h3>
            <p className="text-gray-600 mb-4">
              Customize meal for {customizationModal.user?.name}
            </p>
            <textarea
              placeholder="Enter customization details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              rows="3"
              id="customizations"
            ></textarea>
            <input
              type="text"
              placeholder="Additional notes (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              id="customNotes"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCustomizationModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const customizations =
                    document.getElementById("customizations").value;
                  const notes = document.getElementById("customNotes").value;
                  if (customizations.trim()) {
                    handleCustomizeMeal(
                      customizationModal._id,
                      customizations,
                      notes
                    );
                  } else {
                    toast.error("Please enter customization details");
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryManagement;
