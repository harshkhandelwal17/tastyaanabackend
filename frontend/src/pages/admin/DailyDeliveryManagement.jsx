import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  Package,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Settings,
  Edit,
  SkipForward,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAdminDailyDeliveriesQuery,
  useAdminSkipMealMutation,
  useAdminCustomizeMealMutation,
  useUpdateDeliveryStatusMutation,
  useGetAdminDeliveryFiltersQuery,
} from "../../redux/storee/api";

const DailyDeliveryManagement = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD format
  });
  const [filters, setFilters] = useState({
    shift: "both",
    status: "all",
    zone: "all",
    driverId: "all",
    sellerId: "all",
    mealPlanId: "all",
    priceRange: "all",
    search: "",
    sortBy: "user.name",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  });

  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // RTK Query hooks
  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    error: deliveriesError,
    refetch: refetchDeliveries,
  } = useGetAdminDailyDeliveriesQuery({
    date: selectedDate,
    ...filters,
  });

  const { data: filtersData, isLoading: filtersLoading } =
    useGetAdminDeliveryFiltersQuery();

  const [adminSkipMeal] = useAdminSkipMealMutation();
  const [adminCustomizeMeal] = useAdminCustomizeMealMutation();
  const [updateDeliveryStatus] = useUpdateDeliveryStatusMutation();

  const deliveries = deliveriesData?.data || [];
  const stats = deliveriesData?.stats || {};
  const pagination = deliveriesData?.pagination || {};

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  // Handle bulk selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDeliveries(deliveries.map((d) => d._id));
    } else {
      setSelectedDeliveries([]);
    }
  };

  const handleSelectDelivery = (deliveryId, checked) => {
    if (checked) {
      setSelectedDeliveries((prev) => [...prev, deliveryId]);
    } else {
      setSelectedDeliveries((prev) => prev.filter((id) => id !== deliveryId));
    }
  };

  // Skip meal functionality
  const handleSkipMeal = async (subscriptionId, dates, reason, shift) => {
    try {
      const result = await adminSkipMeal({
        subscriptionId,
        dates,
        reason,
        shift,
      }).unwrap();

      toast.success("Meals skipped successfully");
      refetchDeliveries();
      setShowSkipModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to skip meals");
    }
  };

  // Customize meal functionality
  const handleCustomizeMeal = async (subscriptionId, customizationData) => {
    try {
      const result = await adminCustomizeMeal({
        subscriptionId,
        ...customizationData,
      }).unwrap();

      toast.success("Meal customized successfully");
      refetchDeliveries();
      setShowCustomizeModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to customize meal");
    }
  };

  // Update delivery status
  const handleStatusUpdate = async (trackingId, status, notes) => {
    try {
      await updateDeliveryStatus({
        trackingId,
        status,
        notes,
      }).unwrap();

      toast.success(`Status updated to ${status}`);
      refetchDeliveries();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  // Status color mapping
  const getStatusColor = (status, isSkipped) => {
    if (isSkipped) return "bg-red-100 text-red-800";

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      picked_up: "bg-purple-100 text-purple-800",
      out_for_delivery: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (deliveriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading daily deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Daily Delivery Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage subscription deliveries for {formatDate(selectedDate)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
              <button
                onClick={refetchDeliveries}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-700 mr-3">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="morning"
                  name="shift"
                  value="morning"
                  checked={filters.shift === "morning"}
                  onChange={(e) => handleFilterChange("shift", e.target.value)}
                  className="mr-2"
                />
                <label htmlFor="morning" className="text-sm text-gray-700">
                  Morning
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="evening"
                  name="shift"
                  value="evening"
                  checked={filters.shift === "evening"}
                  onChange={(e) => handleFilterChange("shift", e.target.value)}
                  className="mr-2"
                />
                <label htmlFor="evening" className="text-sm text-gray-700">
                  Evening
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="both"
                  name="shift"
                  value="both"
                  checked={filters.shift === "both"}
                  onChange={(e) => handleFilterChange("shift", e.target.value)}
                  className="mr-2"
                />
                <label htmlFor="both" className="text-sm text-gray-700">
                  Both
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Timer className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pending || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.delivered || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Skipped</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.skipped || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Morning</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.morning || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Evening</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.evening || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="User, phone, seller..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              {/* Zone Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <select
                  value={filters.zone}
                  onChange={(e) => handleFilterChange("zone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filtersData?.data?.zones?.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone === "all" ? "All Zones" : zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <select
                  value={filters.driverId}
                  onChange={(e) =>
                    handleFilterChange("driverId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filtersData?.data?.drivers?.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seller Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller
                </label>
                <select
                  value={filters.sellerId}
                  onChange={(e) =>
                    handleFilterChange("sellerId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filtersData?.data?.sellers?.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.businessName || seller.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meal Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Plan
                </label>
                <select
                  value={filters.mealPlanId}
                  onChange={(e) =>
                    handleFilterChange("mealPlanId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filtersData?.data?.mealPlans?.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) =>
                    handleFilterChange("priceRange", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filtersData?.data?.priceRanges?.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user.name">User Name</option>
                  <option value="seller.businessName">Seller Name</option>
                  <option value="zone">Zone</option>
                  <option value="price">Price</option>
                  <option value="status">Status</option>
                  <option value="shift">Shift</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bulk Actions */}
        {selectedDeliveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDeliveries.length} deliveries selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Bulk skip logic
                    if (selectedDeliveries.length === 1) {
                      const delivery = deliveries.find(
                        (d) => d._id === selectedDeliveries[0]
                      );
                      setSelectedDelivery(delivery);
                      setShowSkipModal(true);
                    } else {
                      toast.info("Bulk skip functionality coming soon");
                    }
                  }}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <SkipForward className="h-4 w-4 mr-1 inline" />
                  Skip Selected
                </button>
                <button
                  onClick={() => setSelectedDeliveries([])}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Deliveries ({deliveries.length})
              </h2>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={
                    selectedDeliveries.length === deliveries.length &&
                    deliveries.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">Select All</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meal Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
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
                {deliveries.map((delivery) => (
                  <motion.tr
                    key={delivery._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDeliveries.includes(delivery._id)}
                        onChange={(e) =>
                          handleSelectDelivery(delivery._id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                          {delivery.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {delivery.user?.name || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {delivery.user?.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {delivery.mealPlan?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {delivery.mealPlan?.type}
                        </p>
                        {delivery.customization && (
                          <p className="text-xs text-purple-600 font-medium">
                            Customized
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {delivery.seller?.businessName || delivery.seller?.name}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{delivery.zone}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          delivery.shift === "morning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {delivery.shift}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          delivery.status,
                          delivery.isSkipped
                        )}`}
                      >
                        {delivery.isSkipped
                          ? "SKIPPED"
                          : delivery.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.driver ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                            {delivery.driver.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900">
                            {delivery.driver.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{delivery.price}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowSkipModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Skip Meal"
                        >
                          <SkipForward className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowCustomizeModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Customize Meal"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Show delivery details modal
                            toast.info("Delivery details coming soon");
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {deliveries.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No deliveries found for selected criteria
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterChange("page", pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + Math.max(1, pagination.page - 2);
                return (
                  <button
                    key={page}
                    onClick={() => handleFilterChange("page", page)}
                    className={`px-3 py-2 border rounded-lg ${
                      page === pagination.page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handleFilterChange("page", pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip Meal Modal */}
      <SkipMealModal
        show={showSkipModal}
        delivery={selectedDelivery}
        onClose={() => setShowSkipModal(false)}
        onSkip={handleSkipMeal}
      />

      {/* Customize Meal Modal */}
      <CustomizeMealModal
        show={showCustomizeModal}
        delivery={selectedDelivery}
        onClose={() => setShowCustomizeModal(false)}
        onCustomize={handleCustomizeMeal}
      />
    </div>
  );
};

// Skip Meal Modal Component
const SkipMealModal = ({ show, delivery, onClose, onSkip }) => {
  const [skipData, setSkipData] = useState({
    dates: [new Date().toISOString().split("T")[0]],
    reason: "",
    shift: "both",
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    useRange: false,
  });
  const [customDatesInput, setCustomDatesInput] = useState("");
  const [dateInputMode, setDateInputMode] = useState("single"); // 'single', 'multiple', 'range', 'custom'

  if (!show || !delivery) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalDates = [];

    if (dateInputMode === "single") {
      finalDates = skipData.dates;
    } else if (dateInputMode === "multiple") {
      finalDates = skipData.dates;
    } else if (dateInputMode === "range") {
      finalDates = generateDateRange(dateRange.startDate, dateRange.endDate);
    } else if (dateInputMode === "custom") {
      finalDates = parseCustomDates(customDatesInput);
      if (finalDates.length === 0) {
        toast.error(
          "Invalid date format. Use formats like: 12-15, 2025-12-15, or 12,15,18"
        );
        return;
      }
    }

    if (finalDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }

    // Send just the date strings array as expected by backend
    onSkip(
      delivery.subscriptionId,
      finalDates, // Just send array of date strings
      skipData.reason,
      skipData.shift
    );
  };

  // Generate array of dates between start and end date
  const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      dates.push(dt.toISOString().split("T")[0]);
    }

    return dates;
  };

  // Parse custom date input like "12-15", "12,15,18", "2025-12-15"
  const parseCustomDates = (input) => {
    const dates = [];
    const parts = input.split(",").map((p) => p.trim());
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    for (const part of parts) {
      if (part.includes("-") && part.match(/^\d{1,2}-\d{1,2}$/)) {
        // Handle ranges like "12-15" (within current month/year)
        const [start, end] = part.split("-").map(Number);

        for (let day = start; day <= end; day++) {
          const date = new Date(currentYear, currentMonth, day);
          if (!isNaN(date.getTime())) {
            dates.push(date.toISOString().split("T")[0]);
          }
        }
      } else if (part.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle full date format "2025-12-15"
        const date = new Date(part);
        if (!isNaN(date.getTime())) {
          dates.push(part);
        }
      } else if (part.match(/^\d{1,2}$/)) {
        // Handle single day like "15"
        const day = Number(part);
        const date = new Date(currentYear, currentMonth, day);
        if (!isNaN(date.getTime())) {
          dates.push(date.toISOString().split("T")[0]);
        }
      }
    }

    return [...new Set(dates)]; // Remove duplicates
  };

  const addDate = () => {
    setSkipData((prev) => ({
      ...prev,
      dates: [...prev.dates, new Date().toISOString().split("T")[0]],
    }));
  };

  const removeDate = (index) => {
    setSkipData((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  };

  const updateDate = (index, newDate) => {
    setSkipData((prev) => ({
      ...prev,
      dates: prev.dates.map((date, i) => (i === index ? newDate : date)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-md w-full"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Skip Meal</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer: {delivery.user?.name}
                </label>
                <p className="text-sm text-gray-500">
                  Meal Plan: {delivery.mealPlan?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Selection Method
                </label>
                <select
                  value={dateInputMode}
                  onChange={(e) => setDateInputMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                >
                  <option value="single">Single Date</option>
                  <option value="multiple">Multiple Individual Dates</option>
                  <option value="range">Date Range</option>
                  <option value="custom">
                    Custom Format (12-15, 12,15,18)
                  </option>
                </select>

                {dateInputMode === "single" && (
                  <input
                    type="date"
                    value={skipData.dates[0]}
                    onChange={(e) =>
                      setSkipData((prev) => ({
                        ...prev,
                        dates: [e.target.value],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                )}

                {dateInputMode === "multiple" && (
                  <div className="space-y-2">
                    {skipData.dates.map((date, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => updateDate(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {skipData.dates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDate(index)}
                            className="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDate}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Another Date
                    </button>
                  </div>
                )}

                {dateInputMode === "range" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {dateInputMode === "custom" && (
                  <div>
                    <input
                      type="text"
                      value={customDatesInput}
                      onChange={(e) => setCustomDatesInput(e.target.value)}
                      placeholder="e.g., 12-15 or 12,15,18 or 2025-12-15,2025-12-16"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: "12-15" (Dec 12-15), "12,15,18" (Dec 12,15,18),
                      "2025-12-15,2025-12-16"
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift
                </label>
                <select
                  value={skipData.shift}
                  onChange={(e) =>
                    setSkipData((prev) => ({
                      ...prev,
                      shift: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="both">Both Shifts</option>
                  <option value="morning">Morning Only</option>
                  <option value="evening">Evening Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={skipData.reason}
                  onChange={(e) =>
                    setSkipData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter reason for skipping..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Skip Meal
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Customize Meal Modal Component
const CustomizeMealModal = ({ show, delivery, onClose, onCustomize }) => {
  const [customizationData, setCustomizationData] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: delivery?.shift || "morning",
    type: "one-time",
    replacementMeal: "",
    dietaryPreference: "regular",
    spiceLevel: "medium",
    preferences: {
      noOnion: false,
      noGarlic: false,
      specialInstructions: "",
    },
  });

  if (!show || !delivery) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCustomize(delivery.subscriptionId, customizationData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customize Meal</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer: {delivery.user?.name}
                </label>
                <p className="text-sm text-gray-500">
                  Current Meal Plan: {delivery.mealPlan?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customization Date
                </label>
                <input
                  type="date"
                  value={customizationData.date}
                  onChange={(e) =>
                    setCustomizationData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Preference
                </label>
                <select
                  value={customizationData.dietaryPreference}
                  onChange={(e) =>
                    setCustomizationData((prev) => ({
                      ...prev,
                      dietaryPreference: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="regular">Regular</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spice Level
                </label>
                <select
                  value={customizationData.spiceLevel}
                  onChange={(e) =>
                    setCustomizationData((prev) => ({
                      ...prev,
                      spiceLevel: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra_hot">Extra Hot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={customizationData.preferences.specialInstructions}
                  onChange={(e) =>
                    setCustomizationData((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        specialInstructions: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Any special instructions..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customizationData.preferences.noOnion}
                    onChange={(e) =>
                      setCustomizationData((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          noOnion: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">No Onion</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customizationData.preferences.noGarlic}
                    onChange={(e) =>
                      setCustomizationData((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          noGarlic: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">No Garlic</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Customize Meal
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DailyDeliveryManagement;
